import json
import boto3
import os
from datetime import datetime, timedelta

dsql_client = boto3.client('dsql')

def execute_dsql_query(query: str, parameters: list = None):
    """DSQL 쿼리 실행"""
    try:
        response = dsql_client.execute_statement(
            clusterArn=os.environ['DSQL_CLUSTER_ARN'],
            sql=query,
            parameters=parameters or []
        )
        return response.get('records', [])
    except Exception as e:
        print(f"DSQL Query Error: {e}")
        raise

def create_user_profile(user_id: str, chat_data: dict) -> dict:
    """사용자 프로필 생성"""
    try:
        query = """
        INSERT INTO user_profiles (user_id, formal_ratio, emoji_ratio, avg_length, 
                                 total_messages, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE SET
        formal_ratio = EXCLUDED.formal_ratio,
        emoji_ratio = EXCLUDED.emoji_ratio,
        avg_length = EXCLUDED.avg_length,
        total_messages = EXCLUDED.total_messages,
        updated_at = EXCLUDED.updated_at
        """
        
        now = datetime.now()
        parameters = [
            user_id,
            chat_data.get('formal_ratio', 0.5),
            chat_data.get('emoji_ratio', 0.2),
            chat_data.get('avg_length', 10),
            chat_data.get('total_messages', 0),
            now.isoformat(),
            now.isoformat()
        ]
        
        execute_dsql_query(query, parameters)
        
        return {
            'user_id': user_id,
            'profile_created': True,
            'updated_at': now.isoformat()
        }
        
    except Exception as e:
        raise Exception(f"Profile creation failed: {str(e)}")

def get_user_profile(user_id: str) -> dict:
    """사용자 프로필 조회"""
    try:
        query = "SELECT * FROM user_profiles WHERE user_id = $1"
        records = execute_dsql_query(query, [user_id])
        
        if records:
            record = records[0]
            return {
                'user_id': record['user_id'],
                'formal_ratio': float(record['formal_ratio']),
                'emoji_ratio': float(record['emoji_ratio']),
                'avg_length': float(record['avg_length']),
                'total_messages': record['total_messages'],
                'created_at': record['created_at'],
                'updated_at': record['updated_at']
            }
        else:
            return None
            
    except Exception as e:
        raise Exception(f"Profile retrieval failed: {str(e)}")

def save_response_feedback(user_id: str, response_data: dict, feedback: dict):
    """답변 피드백 저장"""
    try:
        query = """
        INSERT INTO response_feedback (user_id, response_type, response_text, 
                                     was_used, user_rating, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        """
        
        parameters = [
            user_id,
            response_data.get('type'),
            response_data.get('message'),
            feedback.get('was_used', False),
            feedback.get('rating'),
            datetime.now().isoformat()
        ]
        
        execute_dsql_query(query, parameters)
        
    except Exception as e:
        raise Exception(f"Feedback save failed: {str(e)}")

def lambda_handler(event, context):
    try:
        http_method = event['httpMethod']
        path = event['path']
        body = json.loads(event['body']) if event.get('body') else {}
        
        user_id = event['pathParameters'].get('user_id') if event.get('pathParameters') else body.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id가 필요합니다'})
            }
        
        if http_method == 'POST' and 'profile' in path:
            # 프로필 생성/업데이트
            result = create_user_profile(user_id, body)
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result, ensure_ascii=False)
            }
            
        elif http_method == 'GET' and 'profile' in path:
            # 프로필 조회
            profile = get_user_profile(user_id)
            if profile:
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(profile, ensure_ascii=False)
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': '프로필을 찾을 수 없습니다'})
                }
                
        elif http_method == 'POST' and 'feedback' in path:
            # 피드백 저장
            save_response_feedback(user_id, body.get('response', {}), body.get('feedback', {}))
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': '피드백이 저장되었습니다'})
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': '지원하지 않는 요청입니다'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': str(e),
                'message': '서버 오류가 발생했습니다'
            })
        }
