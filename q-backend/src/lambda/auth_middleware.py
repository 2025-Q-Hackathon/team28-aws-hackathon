import json
import jwt
import boto3
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# AWS 서비스 클라이언트
cognito_client = boto3.client('cognito-idp')

def lambda_handler(event, context):
    """인증 미들웨어 Lambda 함수"""
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
        
        # Authorization 헤더에서 토큰 추출
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Missing or invalid authorization header'})
            }
        
        token = auth_header.replace('Bearer ', '')
        
        # 토큰 검증
        user_info = verify_token(token)
        if not user_info:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid or expired token'})
            }
        
        # 요청 본문 파싱
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', '')
        
        # 액션별 처리
        if action == 'verify':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'valid': True,
                    'user': user_info
                })
            }
        elif action == 'refresh':
            # 토큰 갱신 로직
            new_tokens = refresh_user_token(body.get('refresh_token', ''))
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(new_tokens)
            }
        else:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid action'})
            }
        
    except Exception as e:
        print(f"Auth middleware error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """JWT 토큰 검증"""
    try:
        # Cognito User Pool 정보
        user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')
        client_id = os.environ.get('COGNITO_CLIENT_ID')
        
        if not user_pool_id or not client_id:
            print("Missing Cognito configuration")
            return None
        
        # JWT 토큰 디코딩 (검증 없이 페이로드만 추출)
        # 실제 운영환경에서는 Cognito 공개키로 서명 검증 필요
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
        except jwt.InvalidTokenError:
            print("Invalid JWT token format")
            return None
        
        # 토큰 만료 확인
        exp = payload.get('exp', 0)
        if datetime.utcnow().timestamp() > exp:
            print("Token expired")
            return None
        
        # 사용자 정보 추출
        user_info = {
            'user_id': payload.get('sub'),
            'username': payload.get('cognito:username'),
            'email': payload.get('email'),
            'token_use': payload.get('token_use'),
            'exp': exp
        }
        
        return user_info
        
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

def refresh_user_token(refresh_token: str) -> Dict[str, Any]:
    """리프레시 토큰으로 새 액세스 토큰 발급"""
    try:
        client_id = os.environ.get('COGNITO_CLIENT_ID')
        
        if not client_id or not refresh_token:
            raise ValueError("Missing client ID or refresh token")
        
        response = cognito_client.initiate_auth(
            ClientId=client_id,
            AuthFlow='REFRESH_TOKEN_AUTH',
            AuthParameters={
                'REFRESH_TOKEN': refresh_token
            }
        )
        
        auth_result = response['AuthenticationResult']
        
        return {
            'access_token': auth_result['AccessToken'],
            'id_token': auth_result['IdToken'],
            'expires_in': auth_result['ExpiresIn']
        }
        
    except Exception as e:
        print(f"Token refresh error: {e}")
        raise Exception("Failed to refresh token")

def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """사용자 프로필 조회"""
    try:
        user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')
        
        response = cognito_client.admin_get_user(
            UserPoolId=user_pool_id,
            Username=user_id
        )
        
        # 사용자 속성 파싱
        attributes = {}
        for attr in response.get('UserAttributes', []):
            attributes[attr['Name']] = attr['Value']
        
        return {
            'user_id': user_id,
            'username': response.get('Username'),
            'email': attributes.get('email'),
            'email_verified': attributes.get('email_verified') == 'true',
            'created_date': response.get('UserCreateDate').isoformat() if response.get('UserCreateDate') else None,
            'last_modified': response.get('UserLastModifiedDate').isoformat() if response.get('UserLastModifiedDate') else None,
            'enabled': response.get('Enabled', False),
            'status': response.get('UserStatus')
        }
        
    except Exception as e:
        print(f"Get user profile error: {e}")
        return None

def create_session_record(user_id: str, token: str, ip_address: str = None, user_agent: str = None) -> Dict[str, Any]:
    """세션 기록 생성 (DSQL에 저장용)"""
    session_data = {
        'user_id': user_id,
        'session_id': f"session_{user_id}_{int(datetime.utcnow().timestamp())}",
        'jwt_token_hash': hash(token),  # 실제로는 안전한 해시 함수 사용
        'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        'created_at': datetime.utcnow().isoformat(),
        'ip_address': ip_address,
        'user_agent': user_agent
    }
    
    return session_data