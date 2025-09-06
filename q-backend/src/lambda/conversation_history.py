import json
import boto3
import os
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

# AWS 서비스 클라이언트
dsql_client = boto3.client('dsql')

def lambda_handler(event, context):
    """대화 기록 저장 및 조회 Lambda 함수"""
    try:
        # CORS 헤더
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        # OPTIONS 요청 처리
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # HTTP 메서드별 처리
        http_method = event.get('httpMethod', 'POST')
        
        if http_method == 'POST':
            return save_conversation(event, headers)
        elif http_method == 'GET':
            return get_conversation_history(event, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
        
    except Exception as e:
        print(f"Conversation history error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def save_conversation(event, headers) -> Dict[str, Any]:
    """대화 기록 저장"""
    try:
        # 요청 본문 파싱
        body = json.loads(event.get('body', '{}'))
        
        # 필수 필드 검증
        required_fields = ['user_id', 'user_message', 'ai_responses']
        for field in required_fields:
            if not body.get(field):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # 대화 기록 데이터 구성
        conversation_data = {
            'user_id': body['user_id'],
            'session_id': body.get('session_id', f"session_{uuid.uuid4().hex[:8]}"),
            'partner_name': body.get('partner_name', ''),
            'partner_relationship': body.get('partner_relationship', ''),
            'context_text': body.get('context_text', ''),
            'user_message': body['user_message'],
            'ai_responses': json.dumps(body['ai_responses']),  # JSON으로 저장
            'selected_response_type': body.get('selected_response_type'),
            'selected_response': body.get('selected_response'),
            'feedback_rating': body.get('feedback_rating'),
            'feedback_comment': body.get('feedback_comment', '')
        }
        
        # DSQL에 저장
        conversation_id = save_to_dsql(conversation_data)
        
        # 사용 통계 업데이트
        update_usage_stats(body['user_id'])
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'conversation_id': conversation_id,
                'message': 'Conversation saved successfully'
            })
        }
        
    except Exception as e:
        print(f"Save conversation error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def get_conversation_history(event, headers) -> Dict[str, Any]:
    """대화 기록 조회"""
    try:
        # 쿼리 파라미터 추출
        query_params = event.get('queryStringParameters', {}) or {}
        user_id = query_params.get('user_id')
        limit = int(query_params.get('limit', 20))
        offset = int(query_params.get('offset', 0))
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id is required'})
            }
        
        # DSQL에서 조회
        conversations = get_from_dsql(user_id, limit, offset)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'conversations': conversations,
                'total_count': len(conversations),
                'limit': limit,
                'offset': offset
            })
        }
        
    except Exception as e:
        print(f"Get conversation history error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def save_to_dsql(conversation_data: Dict[str, Any]) -> int:
    """DSQL에 대화 기록 저장"""
    try:
        cluster_arn = os.environ.get('DSQL_CLUSTER_ARN')
        
        if not cluster_arn:
            raise ValueError("DSQL_CLUSTER_ARN not configured")
        
        # SQL 쿼리 구성
        sql = """
        INSERT INTO conversations (
            user_id, session_id, partner_name, partner_relationship,
            context_text, user_message, ai_responses, selected_response_type,
            selected_response, feedback_rating, feedback_comment, created_at
        ) VALUES (
            %(user_id)s, %(session_id)s, %(partner_name)s, %(partner_relationship)s,
            %(context_text)s, %(user_message)s, %(ai_responses)s, %(selected_response_type)s,
            %(selected_response)s, %(feedback_rating)s, %(feedback_comment)s, NOW()
        ) RETURNING conversation_id
        """
        
        # 실제 운영환경에서는 DSQL 클라이언트 사용
        # 현재는 시뮬레이션
        conversation_id = simulate_dsql_insert(conversation_data)
        
        return conversation_id
        
    except Exception as e:
        print(f"DSQL save error: {e}")
        raise

def get_from_dsql(user_id: str, limit: int, offset: int) -> List[Dict[str, Any]]:
    """DSQL에서 대화 기록 조회"""
    try:
        cluster_arn = os.environ.get('DSQL_CLUSTER_ARN')
        
        if not cluster_arn:
            raise ValueError("DSQL_CLUSTER_ARN not configured")
        
        # SQL 쿼리 구성
        sql = """
        SELECT 
            conversation_id, session_id, partner_name, partner_relationship,
            context_text, user_message, ai_responses, selected_response_type,
            selected_response, feedback_rating, feedback_comment, created_at
        FROM conversations 
        WHERE user_id = %(user_id)s 
        ORDER BY created_at DESC 
        LIMIT %(limit)s OFFSET %(offset)s
        """
        
        # 실제 운영환경에서는 DSQL 클라이언트 사용
        # 현재는 시뮬레이션
        conversations = simulate_dsql_select(user_id, limit, offset)
        
        return conversations
        
    except Exception as e:
        print(f"DSQL get error: {e}")
        raise

def update_usage_stats(user_id: str):
    """사용 통계 업데이트"""
    try:
        # 오늘 날짜의 통계 업데이트
        today = datetime.now().date().isoformat()
        
        # UPSERT 쿼리 (있으면 업데이트, 없으면 삽입)
        sql = """
        INSERT INTO usage_stats (user_id, date, conversations_count, responses_generated, created_at)
        VALUES (%(user_id)s, %(date)s, 1, 3, NOW())
        ON CONFLICT (user_id, date) 
        DO UPDATE SET 
            conversations_count = usage_stats.conversations_count + 1,
            responses_generated = usage_stats.responses_generated + 3
        """
        
        # 실제 운영환경에서는 DSQL 실행
        print(f"Updated usage stats for user {user_id} on {today}")
        
    except Exception as e:
        print(f"Usage stats update error: {e}")

def simulate_dsql_insert(data: Dict[str, Any]) -> int:
    """DSQL INSERT 시뮬레이션 (개발용)"""
    # 실제로는 DSQL 클라이언트로 실행
    conversation_id = hash(f"{data['user_id']}_{datetime.now().isoformat()}") % 1000000
    print(f"Simulated DSQL INSERT: conversation_id = {conversation_id}")
    return conversation_id

def simulate_dsql_select(user_id: str, limit: int, offset: int) -> List[Dict[str, Any]]:
    """DSQL SELECT 시뮬레이션 (개발용)"""
    # 실제로는 DSQL 클라이언트로 실행
    sample_conversations = [
        {
            'conversation_id': 1,
            'session_id': 'session_123',
            'partner_name': '민수',
            'partner_relationship': '썸',
            'context_text': '영화 얘기를 하고 있었음',
            'user_message': '영화 보자고 했는데 뭐라고 답할까?',
            'ai_responses': json.dumps([
                {'type': '안전형', 'message': '좋아! 언제 볼까?'},
                {'type': '표준형', 'message': '오 좋은데? 어떤 영화?'},
                {'type': '대담형', 'message': '완전 좋아! 같이 보자 😍'}
            ]),
            'selected_response_type': '표준형',
            'selected_response': '오 좋은데? 어떤 영화?',
            'feedback_rating': 4,
            'feedback_comment': '좋은 답변이었어요',
            'created_at': datetime.now().isoformat()
        }
    ]
    
    print(f"Simulated DSQL SELECT: {len(sample_conversations)} conversations for user {user_id}")
    return sample_conversations[:limit]

def get_user_dashboard_data(user_id: str) -> Dict[str, Any]:
    """사용자 대시보드 데이터 조회"""
    try:
        # 사용자 통계 조회
        sql = """
        SELECT * FROM user_dashboard WHERE user_id = %(user_id)s
        """
        
        # 실제로는 DSQL에서 조회
        dashboard_data = {
            'user_id': user_id,
            'total_conversations': 15,
            'today_conversations': 3,
            'avg_response_rating': 4.2,
            'overall_success_rate': 0.85,
            'credits_remaining': 7,
            'speech_style': 'casual',
            'favorite_response_type': '표준형'
        }
        
        return dashboard_data
        
    except Exception as e:
        print(f"Dashboard data error: {e}")
        return {}