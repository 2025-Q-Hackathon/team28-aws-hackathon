import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any

# AWS 서비스 클라이언트
dsql_client = boto3.client('dsql')

# 임시 메모리 저장소 (실제 프로덕션에서는 DSQL 사용)
CHAT_ROOMS = {}

def lambda_handler(event, context):
    """대화방 관리 Lambda 함수"""
    try:
        # CORS 헤더
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        # OPTIONS 요청 처리
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        method = event.get('httpMethod', 'GET')
        
        if method == 'GET':
            return get_chat_rooms(event, headers)
        elif method == 'POST':
            return create_chat_room(event, headers)
        elif method == 'PUT':
            return update_chat_room(event, headers)
        elif method == 'DELETE':
            return delete_chat_room(event, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
            
    except Exception as e:
        print(f"Chat room manager error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def get_chat_rooms(event, headers):
    """사용자의 대화방 목록 조회"""
    try:
        user_id = event.get('queryStringParameters', {}).get('user_id')
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id is required'})
            }
        
        print(f"Getting chat rooms for user: {user_id}")
        
        # 사용자의 채팅방 목록 반환
        user_rooms = [room for room in CHAT_ROOMS.values() if room.get('user_id') == user_id]
        rooms = sorted(user_rooms, key=lambda x: x.get('updated_at', ''), reverse=True)
        
        print(f"Found {len(rooms)} rooms for user {user_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'rooms': rooms})
        }
        
    except Exception as e:
        print(f"Get chat rooms error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def create_chat_room(event, headers):
    """새 대화방 생성"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        required_fields = ['user_id', 'partner_name', 'partner_relationship']
        for field in required_fields:
            if not body.get(field):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'{field} is required'})
                }
        
        # 대화방 ID 생성
        room_id = f"room_{int(datetime.now().timestamp())}_{body['partner_name']}"
        
        # 대화방 데이터 생성
        room_data = {
            'id': room_id,
            'user_id': body['user_id'],
            'name': f"{body['partner_name']}와의 대화",
            'partner_name': body['partner_name'],
            'partner_relationship': body['partner_relationship'],
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'message_count': 0,
            'last_message': '새로운 대화가 시작되었습니다.'
        }
        
        # 메모리에 저장 (실제 프로덕션에서는 DSQL 사용)
        CHAT_ROOMS[room_id] = room_data
        
        print(f"Chat room created successfully: {room_data}")
        print(f"Total chat rooms: {len(CHAT_ROOMS)}")
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'room': room_data,
                'message': 'Chat room created successfully'
            })
        }
        
    except Exception as e:
        print(f"Create chat room error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def update_chat_room(event, headers):
    """대화방 정보 업데이트"""
    try:
        body = json.loads(event.get('body', '{}'))
        room_id = body.get('room_id')
        
        if not room_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'room_id is required'})
            }
        
        # 메모리에서 업데이트
        if room_id in CHAT_ROOMS:
            if 'last_message' in body:
                CHAT_ROOMS[room_id]['last_message'] = body['last_message']
            if 'message_count' in body:
                CHAT_ROOMS[room_id]['message_count'] = body['message_count']
            CHAT_ROOMS[room_id]['updated_at'] = datetime.now().isoformat()
            print(f"Updated chat room: {room_id}")
        else:
            print(f"Chat room not found: {room_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Chat room updated successfully'})
        }
        
    except Exception as e:
        print(f"Update chat room error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def delete_chat_room(event, headers):
    """대화방 삭제"""
    try:
        body = json.loads(event.get('body', '{}'))
        room_id = body.get('room_id')
        
        if not room_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'room_id is required'})
            }
        
        # 메모리에서 삭제
        if room_id in CHAT_ROOMS:
            del CHAT_ROOMS[room_id]
            print(f"Deleted chat room: {room_id}")
        else:
            print(f"Chat room not found: {room_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Chat room deleted successfully'})
        }
        
    except Exception as e:
        print(f"Delete chat room error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }