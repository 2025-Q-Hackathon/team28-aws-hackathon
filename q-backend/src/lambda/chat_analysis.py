import json
import boto3
import re
from typing import Dict, List, Any

bedrock = boto3.client('bedrock-runtime')

def lambda_handler(event, context):
    """답변 생성 Lambda 함수"""
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
        context_text = body.get('context', '')
        situation = body.get('situation', '')
        user_style = body.get('user_style', {})
        partner_info = body.get('partner_info', {})
        
        # 답변 생성
        responses = generate_responses(context_text, situation, user_style, partner_info)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'responses': responses})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def generate_responses(context: str, situation: str, user_style: Dict, partner_info: Dict) -> List[Dict]:
    """AI 답변 3안 생성"""
    
    # 파트너 정보 문자열 생성
    partner_context = ""
    if partner_info.get('name'):
        partner_context += f"상대방: {partner_info['name']}\n"
    if partner_info.get('relationship'):
        partner_context += f"관계: {partner_info['relationship']}\n"
    if partner_info.get('personality'):
        partner_context += f"성격: {partner_info['personality']}\n"
    
    prompt = f"""
당신은 연애 상담 전문가입니다. 다음 상황에서 자연스러운 답변 3가지를 생성해주세요.

{partner_context}
대화 맥락: {context}
현재 상황: {situation}

사용자 말투 특성:
- 존댓말 비율: {user_style.get('formal_ratio', 0.3):.1%}
- 이모티콘 사용: {user_style.get('emoji_ratio', 0.2):.1f}개/메시지
- 평균 메시지 길이: {user_style.get('avg_length', 20):.0f}자

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
      "risk_level": 1,
      "confidence": 0.9
    }}
  ]
}}
"""

    try:
        # AWS Bedrock 호출
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20240620-v1:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        )
        
        response_body = json.loads(response['body'].read())
        ai_response = response_body['content'][0]['text']
        
        # JSON 파싱 시도
        try:
            parsed_response = json.loads(ai_response)
            return parsed_response.get('responses', [])
        except json.JSONDecodeError:
            # JSON 파싱 실패 시 기본 응답 반환
            pass
            
    except Exception as e:
        print(f"Bedrock API error: {e}")
    
    # 상황별 맞춤 기본 응답 (API 실패 시)
    if "연락" in situation and "없어" in situation:
        return [
            {
                "type": "안전형",
                "message": "안녕! 잘 지내?",
                "explanation": "자연스럽고 부담 없는 안부 인사로 대화를 재개합니다.",
                "risk_level": 1,
                "confidence": 0.9
            },
            {
                "type": "표준형",
                "message": "요즘 어떻게 지내? 바빴나?",
                "explanation": "관심을 보이면서 상대방의 상황을 이해하려는 모습을 보입니다.",
                "risk_level": 2,
                "confidence": 0.8
            },
            {
                "type": "대담형",
                "message": "연락 없어서 걱정했어 ㅠㅠ 괜찮아?",
                "explanation": "직접적으로 걱정했다는 감정을 표현하여 관심을 드러냅니다.",
                "risk_level": 3,
                "confidence": 0.7
            }
        ]
    
    # 기본 응답
    return [
        {
            "type": "안전형",
            "message": "그렇구나! 재밌겠다 😊",
            "explanation": "무난하고 안전한 반응으로 부담을 주지 않습니다.",
            "risk_level": 1,
            "confidence": 0.9
        },
        {
            "type": "표준형",
            "message": "오 좋은데? 나도 관심있어!",
            "explanation": "적당한 관심을 표현하며 대화를 이어갑니다.",
            "risk_level": 2,
            "confidence": 0.8
        },
        {
            "type": "대담형",
            "message": "완전 좋아! 같이 해볼까? 😍",
            "explanation": "적극적인 호감을 드러내며 함께하고 싶다는 의사를 표현합니다.",
            "risk_level": 4,
            "confidence": 0.7
        }
    ]

