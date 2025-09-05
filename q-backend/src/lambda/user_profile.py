import json
import boto3
import pymysql
import os
from datetime import datetime, timedelta

def get_db_connection():
    """RDS 연결"""
    return pymysql.connect(
        host=os.environ['DB_HOST'],
        user='admin',
        password=os.environ.get('DB_PASSWORD', ''),
        database='loveq',
        charset='utf8mb4'
    )

def create_user_profile(user_id: str, chat_data: dict) -> dict:
    """사용자 프로필 생성"""
    connection = get_db_connection()
    
    try:
        with connection.cursor() as cursor:
            # 사용자 프로필 저장
            sql = """
            INSERT INTO user_profiles (user_id, formal_ratio, emoji_ratio, avg_length, 
                                     total_messages, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            formal_ratio = VALUES(formal_ratio),
            emoji_ratio = VALUES(emoji_ratio),
            avg_length = VALUES(avg_length),
            total_messages = VALUES(total_messages),
            updated_at = VALUES(updated_at)
            """
            
            now = datetime.now()
            cursor.execute(sql, (
                user_id,
                chat_data.get('formal_ratio', 0.5),
                chat_data.get('emoji_ratio', 0.2),
                chat_data.get('avg_length', 10),
                chat_data.get('total_messages', 0),
                now,
                now
            ))
            
            connection.commit()
            
            return {
                'user_id': user_id,
                'profile_created': True,
                'updated_at': now.isoformat()
            }
            
    finally:
        connection.close()

def get_user_profile(user_id: str) -> dict:
    """사용자 프로필 조회"""
    connection = get_db_connection()
    
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = "SELECT * FROM user_profiles WHERE user_id = %s"
            cursor.execute(sql, (user_id,))
            result = cursor.fetchone()
            
            if result:
                return {
                    'user_id': result['user_id'],
                    'formal_ratio': float(result['formal_ratio']),
                    'emoji_ratio': float(result['emoji_ratio']),
                    'avg_length': float(result['avg_length']),
                    'total_messages': result['total_messages'],
                    'created_at': result['created_at'].isoformat(),
                    'updated_at': result['updated_at'].isoformat()
                }
            else:
                return None
                
    finally:
        connection.close()

def save_response_feedback(user_id: str, response_data: dict, feedback: dict):
    """답변 피드백 저장"""
    connection = get_db_connection()
    
    try:
        with connection.cursor() as cursor:
            sql = """
            INSERT INTO response_feedback (user_id, response_type, response_text, 
                                         was_used, user_rating, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(sql, (
                user_id,
                response_data.get('type'),
                response_data.get('message'),
                feedback.get('was_used', False),
                feedback.get('rating'),
                datetime.now()
            ))
            
            connection.commit()
            
    finally:
        connection.close()

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
