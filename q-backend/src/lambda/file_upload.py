import json
import boto3
import base64
import os
from typing import Dict, Any

# AWS 서비스 클라이언트
s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    """파일 업로드 및 처리 Lambda 함수"""
    try:
        # CORS 헤더
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        # OPTIONS 요청 처리
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # 요청 본문 파싱
        body = json.loads(event.get('body', '{}'))
        
        # 필수 필드 검증
        if not body.get('file_content'):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'file_content is required'})
            }
        
        file_content = body['file_content']
        file_type = body.get('file_type', 'txt')
        
        # 파일 내용 검증
        if not file_content.strip():
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'File content is empty'})
            }
        
        # 메시지 추출 및 분석
        messages = extract_messages_from_content(file_content, file_type)
        
        if not messages:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'No valid messages found in file'})
            }
        
        # 말투 분석 호출
        speech_function_name = os.environ.get('SPEECH_ANALYSIS_FUNCTION')
        if speech_function_name:
            analysis_result = invoke_speech_analysis(speech_function_name, messages)
        else:
            # 직접 분석 (fallback)
            analysis_result = analyze_messages_directly(messages)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'messages_count': len(messages),
                'analysis': analysis_result,
                'sample_messages': messages[:5]  # 처음 5개 메시지만
            })
        }
        
    except Exception as e:
        print(f"File upload error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def extract_messages_from_content(content: str, file_type: str) -> list:
    """파일 내용에서 메시지 추출"""
    messages = []
    
    if file_type == 'kakao':
        # 카카오톡 대화 내역 파싱
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith('---') or line.startswith('저장한 날짜'):
                continue
            
            # 시간 패턴 제거 (예: [오후 3:45])
            import re
            time_pattern = r'\[.*?\]'
            line = re.sub(time_pattern, '', line).strip()
            
            # 이름: 메시지 형태에서 메시지만 추출
            if ':' in line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    message = parts[1].strip()
                    if message and len(message) > 1:
                        messages.append(message)
            elif len(line) > 1:
                messages.append(line)
    else:
        # 일반 텍스트 파일
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if line and len(line) > 1:
                messages.append(line)
    
    return messages[:100]  # 최대 100개 메시지

def invoke_speech_analysis(function_name: str, messages: list) -> Dict[str, Any]:
    """말투 분석 Lambda 함수 호출"""
    try:
        payload = {
            'body': json.dumps({'messages': messages}),
            'httpMethod': 'POST'
        }
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        result = json.loads(response['Payload'].read())
        if result.get('statusCode') == 200:
            return json.loads(result['body'])
        else:
            raise Exception(f"Speech analysis failed: {result}")
            
    except Exception as e:
        print(f"Speech analysis invocation error: {e}")
        return analyze_messages_directly(messages)

def analyze_messages_directly(messages: list) -> Dict[str, Any]:
    """직접 메시지 분석 (fallback)"""
    if not messages:
        return {
            "formal_ratio": 0.5,
            "emoji_ratio": 0.2,
            "avg_length": 10,
            "total_messages": 0,
            "tone": "neutral",
            "speech_style": "casual",
            "personality_traits": [],
            "response_examples": []
        }
    
    total_msgs = len(messages)
    
    # 존댓말 패턴
    formal_patterns = ['요', '습니다', '해요', '입니다', '세요', '시죠', '죠']
    formal_count = sum(1 for msg in messages 
                      if any(pattern in msg for pattern in formal_patterns))
    
    # 이모티콘 분석
    import re
    emoji_pattern = r'[😀-🙏ㅋㅎㅠㅜ]|:\)|:\(|:D|XD|><|T_T|\^\^'
    emoji_count = sum(len(re.findall(emoji_pattern, msg)) for msg in messages)
    
    # 평균 길이
    avg_length = sum(len(msg) for msg in messages) / total_msgs
    
    # 톤 분석
    positive_words = ['좋아', '최고', '대박', '완전', '진짜', '헐', '와']
    negative_words = ['싫어', '별로', '아니', '안돼', '힘들어', 'ㅠㅠ']
    
    positive_count = sum(1 for msg in messages 
                        if any(word in msg for word in positive_words))
    negative_count = sum(1 for msg in messages 
                        if any(word in msg for word in negative_words))
    
    if positive_count > negative_count:
        tone = "positive"
    elif negative_count > positive_count:
        tone = "negative"
    else:
        tone = "neutral"
    
    formal_ratio = formal_count / total_msgs
    speech_style = "formal" if formal_ratio > 0.7 else "semi_formal" if formal_ratio > 0.3 else "casual"
    
    # 성격 특성
    traits = []
    if formal_ratio > 0.7:
        traits.append('정중함')
    elif formal_ratio < 0.3:
        traits.append('친근함')
    
    if emoji_count / total_msgs > 0.5:
        traits.append('표현력 풍부')
    
    if avg_length > 50:
        traits.append('상세함')
    elif avg_length < 15:
        traits.append('간단명료')
    
    if tone == "positive":
        traits.append('긍정적')
    
    return {
        "formal_ratio": formal_ratio,
        "emoji_ratio": emoji_count / total_msgs,
        "avg_length": avg_length,
        "total_messages": total_msgs,
        "tone": tone,
        "speech_style": speech_style,
        "personality_traits": traits[:5],
        "response_examples": messages[:3]
    }