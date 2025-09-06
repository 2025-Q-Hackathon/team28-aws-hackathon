import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

# AWS 서비스 클라이언트
dsql_client = boto3.client('dsql')
cognito_client = boto3.client('cognito-idp')

def lambda_handler(event, context):
    """사용자 프로필 관리 Lambda 함수"""
    try:
        # CORS 헤더
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, PUT, OPTIONS',
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
        http_method = event.get('httpMethod', 'GET')
        
        if http_method == 'GET':
            return get_user_profile(event, headers)
        elif http_method == 'POST':
            return create_user_profile(event, headers)
        elif http_method == 'PUT':
            return update_user_profile(event, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
        
    except Exception as e:
        print(f"User profile manager error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def get_user_profile(event, headers) -> Dict[str, Any]:
    """사용자 프로필 조회"""
    try:
        # 쿼리 파라미터에서 user_id 추출
        query_params = event.get('queryStringParameters', {}) or {}
        user_id = query_params.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id is required'})
            }
        
        # 사용자 프로필 조회
        profile_data = get_profile_from_dsql(user_id)
        
        if not profile_data:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'User profile not found'})
            }
        
        # 대시보드 데이터 추가
        dashboard_data = get_dashboard_data(user_id)
        profile_data.update(dashboard_data)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(profile_data)
        }
        
    except Exception as e:
        print(f"Get user profile error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def create_user_profile(event, headers) -> Dict[str, Any]:
    """새 사용자 프로필 생성"""
    try:
        # 요청 본문 파싱
        body = json.loads(event.get('body', '{}'))
        
        # 필수 필드 검증
        required_fields = ['user_id', 'email']
        for field in required_fields:
            if not body.get(field):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # 사용자 기본 정보 생성
        user_data = {
            'user_id': body['user_id'],
            'email': body['email'],
            'username': body.get('username', body['email'].split('@')[0]),
            'subscription_type': 'free'
        }
        
        # 사용자 프로필 생성
        profile_data = {
            'user_id': body['user_id'],
            'total_messages': 0,
            'formal_ratio': 0.5,
            'emoji_ratio': 0.2,
            'avg_length': 20.0,
            'tone': 'neutral',
            'speech_style': 'casual',
            'personality_traits': [],
            'response_examples': []
        }
        
        # 크레딧 초기화
        credit_data = {
            'user_id': body['user_id'],
            'credits_remaining': 10,  # 무료 사용자 10회
            'credits_used': 0
        }
        
        # DSQL에 저장
        create_user_in_dsql(user_data, profile_data, credit_data)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'message': 'User profile created successfully',
                'user_id': body['user_id']
            })
        }
        
    except Exception as e:
        print(f"Create user profile error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def update_user_profile(event, headers) -> Dict[str, Any]:
    """사용자 프로필 업데이트"""
    try:
        # 요청 본문 파싱
        body = json.loads(event.get('body', '{}'))
        
        user_id = body.get('user_id')
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id is required'})
            }
        
        # 업데이트할 필드들
        update_fields = {}
        
        # 말투 분석 결과 업데이트
        if 'speech_analysis' in body:
            speech_data = body['speech_analysis']
            update_fields.update({
                'total_messages': speech_data.get('total_messages'),
                'formal_ratio': speech_data.get('formal_ratio'),
                'emoji_ratio': speech_data.get('emoji_ratio'),
                'avg_length': speech_data.get('avg_length'),
                'tone': speech_data.get('tone'),
                'speech_style': speech_data.get('speech_style'),
                'personality_traits': json.dumps(speech_data.get('personality_traits', [])),
                'response_examples': json.dumps(speech_data.get('response_examples', [])),
                'last_analysis_at': datetime.now().isoformat()
            })
        
        # 기타 프로필 정보 업데이트
        if 'username' in body:
            update_fields['username'] = body['username']
        
        # DSQL 업데이트
        update_profile_in_dsql(user_id, update_fields)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': 'User profile updated successfully',
                'updated_fields': list(update_fields.keys())
            })
        }
        
    except Exception as e:
        print(f"Update user profile error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def get_profile_from_dsql(user_id: str) -> Optional[Dict[str, Any]]:
    """DSQL에서 사용자 프로필 조회"""
    try:
        # 실제로는 DSQL 쿼리 실행
        sql = """
        SELECT 
            u.user_id, u.email, u.username, u.subscription_type, u.created_at,
            up.total_messages, up.formal_ratio, up.emoji_ratio, up.avg_length,
            up.tone, up.speech_style, up.personality_traits, up.response_examples,
            up.last_analysis_at,
            uc.credits_remaining, uc.credits_used
        FROM users u
        LEFT JOIN user_profiles up ON u.user_id = up.user_id
        LEFT JOIN user_credits uc ON u.user_id = uc.user_id
        WHERE u.user_id = %(user_id)s AND u.is_active = true
        """
        
        # 시뮬레이션 데이터
        profile_data = {
            'user_id': user_id,
            'email': 'user@example.com',
            'username': 'testuser',
            'subscription_type': 'free',
            'total_messages': 25,
            'formal_ratio': 0.3,
            'emoji_ratio': 0.4,
            'avg_length': 28.5,
            'tone': 'positive',
            'speech_style': 'casual',
            'personality_traits': ['친근함', '표현력 풍부', '긍정적'],
            'response_examples': ['안녕!', '좋아요!', '그렇구나~'],
            'credits_remaining': 7,
            'credits_used': 3,
            'last_analysis_at': datetime.now().isoformat(),
            'created_at': datetime.now().isoformat()
        }
        
        return profile_data
        
    except Exception as e:
        print(f"Get profile from DSQL error: {e}")
        return None

def get_dashboard_data(user_id: str) -> Dict[str, Any]:
    """대시보드 데이터 조회"""
    try:
        # 실제로는 DSQL 뷰에서 조회
        sql = """
        SELECT * FROM user_dashboard WHERE user_id = %(user_id)s
        """
        
        # 시뮬레이션 데이터
        dashboard_data = {
            'total_conversations': 15,
            'today_conversations': 3,
            'avg_response_rating': 4.2,
            'overall_success_rate': 0.85,
            'favorite_response_type': '표준형',
            'recent_activity': [
                {
                    'date': datetime.now().date().isoformat(),
                    'conversations': 3,
                    'avg_rating': 4.5
                }
            ]
        }
        
        return dashboard_data
        
    except Exception as e:
        print(f"Get dashboard data error: {e}")
        return {}

def create_user_in_dsql(user_data: Dict, profile_data: Dict, credit_data: Dict):
    """DSQL에 새 사용자 생성"""
    try:
        # 실제로는 트랜잭션으로 처리
        
        # 1. users 테이블 삽입
        user_sql = """
        INSERT INTO users (user_id, email, username, subscription_type, created_at)
        VALUES (%(user_id)s, %(email)s, %(username)s, %(subscription_type)s, NOW())
        """
        
        # 2. user_profiles 테이블 삽입
        profile_sql = """
        INSERT INTO user_profiles (
            user_id, total_messages, formal_ratio, emoji_ratio, avg_length,
            tone, speech_style, personality_traits, response_examples, created_at
        ) VALUES (
            %(user_id)s, %(total_messages)s, %(formal_ratio)s, %(emoji_ratio)s, %(avg_length)s,
            %(tone)s, %(speech_style)s, %(personality_traits)s, %(response_examples)s, NOW()
        )
        """
        
        # 3. user_credits 테이블 삽입
        credit_sql = """
        INSERT INTO user_credits (user_id, credits_remaining, credits_used, created_at)
        VALUES (%(user_id)s, %(credits_remaining)s, %(credits_used)s, NOW())
        """
        
        print(f"Created user profile for {user_data['user_id']}")
        
    except Exception as e:
        print(f"Create user in DSQL error: {e}")
        raise

def update_profile_in_dsql(user_id: str, update_fields: Dict[str, Any]):
    """DSQL에서 사용자 프로필 업데이트"""
    try:
        if not update_fields:
            return
        
        # 동적 UPDATE 쿼리 생성
        set_clauses = []
        for field in update_fields.keys():
            set_clauses.append(f"{field} = %({field})s")
        
        sql = f"""
        UPDATE user_profiles 
        SET {', '.join(set_clauses)}, updated_at = NOW()
        WHERE user_id = %(user_id)s
        """
        
        update_fields['user_id'] = user_id
        
        print(f"Updated profile for {user_id}: {list(update_fields.keys())}")
        
    except Exception as e:
        print(f"Update profile in DSQL error: {e}")
        raise

def deduct_credits(user_id: str, amount: int = 1) -> bool:
    """크레딧 차감"""
    try:
        sql = """
        UPDATE user_credits 
        SET credits_remaining = credits_remaining - %(amount)s,
            credits_used = credits_used + %(amount)s,
            updated_at = NOW()
        WHERE user_id = %(user_id)s AND credits_remaining >= %(amount)s
        """
        
        # 실제로는 DSQL에서 실행하고 affected_rows 확인
        print(f"Deducted {amount} credits from user {user_id}")
        return True
        
    except Exception as e:
        print(f"Deduct credits error: {e}")
        return False