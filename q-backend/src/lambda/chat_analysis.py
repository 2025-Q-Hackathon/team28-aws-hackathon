import json
import boto3
import re
from typing import Dict, List, Any

bedrock = boto3.client('bedrock-runtime')

def analyze_chat_style(messages: List[str]) -> Dict[str, Any]:
    """사용자 말투 분석"""
    total_msgs = len(messages)
    if total_msgs == 0:
        return {"formal_ratio": 0.5, "emoji_ratio": 0.2, "avg_length": 10}
    
    formal_count = sum(1 for msg in messages if any(word in msg for word in ['요', '습니다', '해요', '입니다']))
    emoji_count = sum(len(re.findall(r'[😀-🙏ㅋㅎ]', msg)) for msg in messages)
    avg_length = sum(len(msg) for msg in messages) / total_msgs
    
    return {
        "formal_ratio": formal_count / total_msgs,
        "emoji_ratio": emoji_count / total_msgs,
        "avg_length": avg_length
    }

def generate_responses(context: str, situation: str, user_style: Dict) -> List[Dict]:
    """AI 답변 3안 생성"""
    
    prompt = f"""
당신은 연애 상담 전문가입니다. 다음 상황에서 자연스러운 답변 3가지를 생성해주세요.

대화 맥락: {context}
현재 상황: {situation}
사용자 말투 특성:
- 존댓말 비율: {user_style['formal_ratio']:.1%}
- 이모티콘 사용: {user_style['emoji_ratio']:.1f}개/메시지
- 평균 메시지 길이: {user_style['avg_length']:.0f}자

3가지 답변을 생성해주세요:
1. 안전형: 무난하고 안전한 답변
2. 표준형: 적당히 관심을 보이는 답변  
3. 대담형: 적극적이고 호감을 드러내는 답변

각 답변마다 왜 이 답변이 적합한지, 어떤 리스크가 있는지 설명해주세요.

JSON 형식으로 응답:
{{
  "responses": [
    {{
      "type": "안전형",
      "message": "답변 내용",
      "explanation": "이 답변이 적합한 이유",
      "risk_level": "낮음/보통/높음",
      "confidence": 85
    }}
  ]
}}
"""

    try:
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        
        result = json.loads(response['body'].read())
        content = result['content'][0]['text']
        
        # JSON 파싱
        responses_data = json.loads(content)
        return responses_data['responses']
        
    except Exception as e:
        # 폴백 응답
        return [
            {
                "type": "안전형",
                "message": "아 그렇구나! 나도 그런 생각 해본 적 있어",
                "explanation": "무난하고 공감하는 답변으로 안전합니다",
                "risk_level": "낮음",
                "confidence": 75
            },
            {
                "type": "표준형", 
                "message": "오 재밌네! 나도 그런 거 좋아해 ㅎㅎ",
                "explanation": "관심을 보이면서도 부담스럽지 않은 답변",
                "risk_level": "보통",
                "confidence": 80
            },
            {
                "type": "대담형",
                "message": "우와 완전 내 스타일이야! 언제 같이 해볼까? 😊",
                "explanation": "적극적인 호감 표현으로 관계 발전 가능성 높음",
                "risk_level": "높음", 
                "confidence": 70
            }
        ]

def lambda_handler(event, context):
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        chat_history = body.get('chat_history', [])
        situation = body.get('situation', '일반 대화')
        recent_context = body.get('recent_context', '')
        
        # 사용자 말투 분석
        user_messages = [msg for msg in chat_history if msg.get('sender') == 'user']
        user_texts = [msg['text'] for msg in user_messages]
        user_style = analyze_chat_style(user_texts)
        
        # AI 답변 생성
        responses = generate_responses(recent_context, situation, user_style)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'user_style': user_style,
                'responses': responses,
                'analysis_complete': True
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error'
            })
        }
