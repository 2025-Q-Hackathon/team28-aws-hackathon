import json
import re
from typing import Dict, List, Any

def lambda_handler(event, context):
    """말투 분석 Lambda 함수"""
    try:
        # CORS 헤더
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
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
        messages = body.get('messages', [])
        
        if not messages:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Messages are required'})
            }
        
        # 말투 분석 수행
        analysis_result = analyze_speech_style(messages)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(analysis_result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def analyze_speech_style(messages: List[str]) -> Dict[str, Any]:
    """사용자 말투 분석"""
    total_msgs = len(messages)
    if total_msgs == 0:
        return {
            "formal_ratio": 0.5,
            "emoji_ratio": 0.2,
            "avg_length": 10,
            "total_messages": 0,
            "tone": "neutral",
            "speech_style": "casual"
        }
    
    # 존댓말 패턴 분석
    formal_patterns = ['요', '습니다', '해요', '입니다', '세요', '시죠', '죠']
    formal_count = sum(1 for msg in messages 
                      if any(pattern in msg for pattern in formal_patterns))
    
    # 이모티콘 분석
    emoji_pattern = r'[😀-🙏ㅋㅎㅠㅜ]|:\)|:\(|:D|XD|><|T_T|\^\^'
    emoji_count = sum(len(re.findall(emoji_pattern, msg)) for msg in messages)
    
    # 평균 메시지 길이
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
    
    # 말투 스타일 결정
    formal_ratio = formal_count / total_msgs
    if formal_ratio > 0.7:
        speech_style = "formal"
    elif formal_ratio > 0.3:
        speech_style = "semi_formal"
    else:
        speech_style = "casual"
    
    return {
        "formal_ratio": formal_ratio,
        "emoji_ratio": emoji_count / total_msgs,
        "avg_length": avg_length,
        "total_messages": total_msgs,
        "tone": tone,
        "speech_style": speech_style
    }
