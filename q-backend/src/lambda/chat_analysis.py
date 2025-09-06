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
    """AI 답변 생성 (사용자 맞춤 단일 답변)"""
    
    # 파트너 정보 문자열 생성
    partner_context = ""
    if partner_info.get('name'):
        partner_context += f"상대방: {partner_info['name']}\n"
    if partner_info.get('relationship'):
        partner_context += f"관계: {partner_info['relationship']}\n"
    if partner_info.get('personality'):
        partner_context += f"성격: {partner_info['personality']}\n"
    
    # 감정 데이터 추출
    emotion_data = user_style.get('emotion_data', {})
    sentiment = emotion_data.get('sentiment', 'NEUTRAL')
    sentiment_confidence = emotion_data.get('sentiment_confidence', 0.5)
    personality_traits = user_style.get('personality_traits', [])
    
    # 사용자 위험 허용도 계산
    risk_tolerance = calculate_risk_tolerance(user_style)
    response_type = get_response_type(risk_tolerance)
    
    # 감정 상태를 고려한 프롬프트
    emotion_context = f"""
사용자 감정 상태:
- 전반적 감정: {sentiment} (신뢰도: {sentiment_confidence:.1%})
- 성격 특성: {', '.join(personality_traits) if personality_traits else '일반적'}
- 추천 답변 타입: {response_type}
"""
    
    prompt = f"""
당신은 연애 상담 전문가입니다. 사용자가 상대방에게 보낼 메시지와 사용 조언을 분리해서 제공해주세요.

{partner_context}
{emotion_context}
대화 맥락: {context}
현재 상황: {situation}

사용자 말투 특성:
- 존댓말 비율: {user_style.get('formal_ratio', 0.3):.1%}
- 이모티콘 사용: {user_style.get('emoji_ratio', 0.2):.1f}개/메시지
- 평균 메시지 길이: {user_style.get('avg_length', 20):.0f}자
- 말투 스타일: {user_style.get('speech_style', 'casual')}

{response_type} 스타일로 답변을 생성해주세요.

JSON 형식으로 응답:
{{
  "type": "{response_type}",
  "message": "상대방에게 보낼 실제 메시지 (복사용)",
  "advice": "사용자를 위한 조언 및 설명",
  "risk_level": {int(risk_tolerance)},
  "confidence": 0.9
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
            # 단일 응답을 배열로 감싸서 반환
            if 'type' in parsed_response:
                return [parsed_response]
            return parsed_response.get('responses', [])
        except json.JSONDecodeError:
            # JSON 파싱 실패 시 기본 응답 반환
            pass
            
    except Exception as e:
        print(f"Bedrock API error: {e}")
    
    # 감정 상태를 고려한 맞춤 기본 응답 (API 실패 시)
    emotion_data = user_style.get('emotion_data', {})
    sentiment = emotion_data.get('sentiment', 'NEUTRAL')
    risk_tolerance = calculate_risk_tolerance(user_style)
    response_type = get_response_type(risk_tolerance)
    
    if "연락" in situation and "없어" in situation:
        if sentiment == 'NEGATIVE':
            messages = {
                "안전형": "안녕! 괜찮아?",
                "균형형": "요즘 힘든 일 있었어?",
                "대담형": "연락 없어서 걱정됐어 ㅠㅠ"
            }
            advice = {
                "안전형": "부정적 감정을 고려해 걱정을 표현하는 안전한 접근입니다.",
                "균형형": "상대방의 상황을 이해하려 하며 지지를 표현합니다.",
                "대담형": "직접적인 걱정과 관심을 표현하여 감정적 지지를 제공합니다."
            }
        else:
            messages = {
                "안전형": "안녕! 잘 지내?",
                "균형형": "요즘 어떻게 지내? 바빴나?",
                "대담형": "연락 없어서 궁금했어! 뭐하고 지냈어?"
            }
            advice = {
                "안전형": "자연스럽고 부담 없는 안부 인사로 대화를 재개합니다.",
                "균형형": "관심을 보이면서 상대방의 상황을 이해하려는 모습을 보입니다.",
                "대담형": "적극적인 관심을 표현하며 대화를 이끌어갑니다."
            }
        
        return [{
            "type": response_type,
            "message": messages.get(response_type, messages["균형형"]),
            "advice": advice.get(response_type, advice["균형형"]),
            "risk_level": int(risk_tolerance),
            "confidence": 0.8
        }]
    
    # 감정 상태를 고려한 기본 응답
    if sentiment == 'POSITIVE':
        messages = {
            "안전형": "그렇구나! 재밌겠다 😊",
            "균형형": "오 좋은데? 나도 관심있어!",
            "대담형": "완전 좋아! 같이 해볼까? 😍"
        }
        advice = {
            "안전형": "긍정적 감정에 맞춰 밝고 무난한 반응을 보입니다.",
            "균형형": "긍정적 에너지에 맞춰 적극적인 관심을 표현합니다.",
            "대담형": "높은 텐션에 맞춰 적극적인 호감과 참여 의사를 표현합니다."
        }
    else:
        messages = {
            "안전형": "그렇구나~ 어떤 느낌이야?",
            "균형형": "흥미롭네! 더 자세히 얘기해줄래?",
            "대담형": "오 신기하다! 나도 알고 싶어 😊"
        }
        advice = {
            "안전형": "중립적이고 안전한 반응으로 상대방의 감정을 탐색합니다.",
            "균형형": "적당한 관심을 보이며 대화를 이어가려 합니다.",
            "대담형": "적극적인 호기심을 표현하며 관심을 드러냅니다."
        }
    
    return [{
        "type": response_type,
        "message": messages.get(response_type, messages["균형형"]),
        "advice": advice.get(response_type, advice["균형형"]),
        "risk_level": int(risk_tolerance),
        "confidence": 0.8
    }]

def calculate_risk_tolerance(user_style: Dict) -> float:
    """사용자 위험 허용도 계산"""
    risk_level = 2.5  # 기본값
    
    # 이모티콘 사용이 많으면 더 적극적
    emoji_ratio = user_style.get('emoji_ratio', 0.2)
    if emoji_ratio > 0.5:
        risk_level += 0.5
    
    # 존댓말 비율이 낮으면 더 캐주얼
    formal_ratio = user_style.get('formal_ratio', 0.5)
    if formal_ratio < 0.3:
        risk_level += 0.5
    
    # 메시지 길이가 짧으면 더 직접적
    avg_length = user_style.get('avg_length', 20)
    if avg_length < 20:
        risk_level += 0.3
    
    # 성격 특성 고려
    personality_traits = user_style.get('personality_traits', [])
    if any(trait in ['활발함', '적극적', '표현력 풍부'] for trait in personality_traits):
        risk_level += 0.4
    
    return min(max(risk_level, 1), 5)

def get_response_type(risk_tolerance: float) -> str:
    """위험 허용도에 따른 답변 타입 결정"""
    if risk_tolerance <= 2.0:
        return "안전형"
    elif risk_tolerance >= 3.5:
        return "대담형"
    else:
        return "균형형"

