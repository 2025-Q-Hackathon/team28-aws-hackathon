import json
import boto3
import base64
import uuid
import re
from datetime import datetime
from typing import List, Dict

s3 = boto3.client('s3')

def parse_kakao_chat(content: str) -> List[Dict]:
    """카카오톡 대화 파싱"""
    lines = content.strip().split('\n')
    messages = []
    
    # 카톡 패턴: [이름] [오후 3:45] 메시지
    pattern = r'\[(.+?)\] \[(.+?)\] (.+)'
    
    for line in lines:
        if not line.strip():
            continue
            
        match = re.match(pattern, line)
        if match:
            name, time, message = match.groups()
            messages.append({
                'sender': name.strip(),
                'time': time.strip(),
                'text': message.strip()
            })
        else:
            # 이전 메시지에 이어지는 내용
            if messages:
                messages[-1]['text'] += ' ' + line.strip()
    
    return messages

def extract_conversation_stats(messages: List[Dict]) -> Dict:
    """대화 통계 추출"""
    if not messages:
        return {}
    
    senders = list(set(msg['sender'] for msg in messages))
    total_messages = len(messages)
    
    stats = {
        'total_messages': total_messages,
        'participants': senders,
        'message_count_by_sender': {}
    }
    
    for sender in senders:
        sender_msgs = [msg for msg in messages if msg['sender'] == sender]
        stats['message_count_by_sender'][sender] = len(sender_msgs)
    
    return stats

def lambda_handler(event, context):
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        # 파일 업로드 처리
        if 'file_content' in body:
            # Base64 디코딩
            file_content = base64.b64decode(body['file_content']).decode('utf-8')
            file_name = body.get('file_name', 'chat.txt')
        else:
            # 직접 텍스트 입력
            file_content = body.get('text_content', '')
            file_name = 'direct_input.txt'
        
        if not file_content:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': '파일 내용이 없습니다'})
            }
        
        # 카톡 대화 파싱
        messages = parse_kakao_chat(file_content)
        
        if not messages:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': '올바른 카카오톡 대화 형식이 아닙니다'})
            }
        
        # 통계 생성
        stats = extract_conversation_stats(messages)
        
        # S3에 임시 저장 (7일 후 자동 삭제)
        file_id = str(uuid.uuid4())
        s3_key = f"chats/{file_id}.json"
        
        s3.put_object(
            Bucket=os.environ['S3_BUCKET'],
            Key=s3_key,
            Body=json.dumps({
                'messages': messages,
                'stats': stats,
                'uploaded_at': datetime.now().isoformat(),
                'original_filename': file_name
            }, ensure_ascii=False),
            ContentType='application/json'
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'file_id': file_id,
                'message_count': len(messages),
                'participants': stats['participants'],
                'stats': stats,
                'preview': messages[:5]  # 처음 5개 메시지 미리보기
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': str(e),
                'message': '파일 처리 중 오류가 발생했습니다'
            })
        }
