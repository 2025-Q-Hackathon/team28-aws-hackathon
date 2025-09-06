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
    """AI 답변 생성 (상대방 정보 기반 맞춤 답변)"""
    
    # 상대방 정보 상세 분석
    partner_context = build_partner_context(partner_info)
    
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
당신은 연애 상담 전문가입니다. 상대방의 성격과 특성을 깊이 분석하여 가장 효과적인 메시지를 제안해주세요.

{partner_context}
{emotion_context}
대화 맥락: {context}
현재 상황: {situation}

사용자 말투 특성:
- 존댓말 비율: {user_style.get('formal_ratio', 0.3):.1%}
- 이모티콘 사용: {user_style.get('emoji_ratio', 0.2):.1f}개/메시지
- 평균 메시지 길이: {user_style.get('avg_length', 20):.0f}자
- 말투 스타일: {user_style.get('speech_style', 'casual')}

상대방의 성격과 소통 스타일을 고려하여 {response_type} 스타일로 답변을 생성해주세요.
특히 상대방이 선호할 만한 대화 방식과 관심사를 반영해주세요.

JSON 형식으로 응답:
{{
  "type": "{response_type}",
  "message": "상대방에게 보낼 실제 메시지 (복사용)",
  "explanation": "왜 이 답변이 효과적인지 상대방 특성 기반 설명",
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

def build_partner_context(partner_info: Dict) -> str:
    """상대방 정보를 상세하게 분석하여 컨텍스트 생성"""
    context_parts = []
    
    # 기본 정보
    if partner_info.get('name'):
        context_parts.append(f"상대방 이름: {partner_info['name']}")
    if partner_info.get('relationship'):
        context_parts.append(f"관계: {partner_info['relationship']}")
    
    # 상세 설명 분석
    description = partner_info.get('description', '').strip()
    if description:
        context_parts.append(f"상대방 상세 정보:\n{description}")
        
        # 성격 키워드 추출
        personality_keywords = extract_personality_keywords(description)
        if personality_keywords:
            context_parts.append(f"추출된 성격 특성: {', '.join(personality_keywords)}")
    
    # 관심사
    if partner_info.get('interests'):
        context_parts.append(f"관심사/취미: {partner_info['interests']}")
    
    # 소통 스타일
    if partner_info.get('communication_style'):
        context_parts.append(f"소통 스타일: {partner_info['communication_style']}")
        
        # 소통 스타일별 조언 추가
        style_advice = get_communication_advice(partner_info['communication_style'])
        if style_advice:
            context_parts.append(f"소통 전략: {style_advice}")
    
    return "\n".join(context_parts) if context_parts else "상대방 정보 없음"

def extract_personality_keywords(description: str) -> List[str]:
    """설명에서 성격 키워드 추출"""
    keywords = []
    
    # 성격 관련 키워드 매핑
    personality_patterns = {
        '내성적': ['내성적', '조용', '수줍', '소심'],
        '외향적': ['외향적', '활발', '사교적', '적극적'],
        '감성적': ['감성적', '감정적', '로맨틱', '섬세'],
        '논리적': ['논리적', '이성적', '분석적', '체계적'],
        '유머러스': ['유머', '재미있', '웃긴', '장난'],
        '진지함': ['진지', '성실', '책임감', '신중'],
        '독립적': ['독립적', '자립적', '혼자', '개인주의'],
        '배려심': ['배려', '친절', '따뜻', '상냥'],
        '완벽주의': ['완벽', '꼼꼼', '세심', '정확'],
        '자유로움': ['자유', '즉흥', '유연', '개방적']
    }
    
    description_lower = description.lower()
    for trait, patterns in personality_patterns.items():
        if any(pattern in description_lower for pattern in patterns):
            keywords.append(trait)
    
    return keywords[:5]  # 최대 5개

def get_communication_advice(style: str) -> str:
    """소통 스타일별 조언 제공"""
    advice_map = {
        '직설적': '명확하고 솔직한 표현을 선호하므로 돌려서 말하지 말고 직접적으로 의사를 전달하세요.',
        '간접적': '직접적인 표현보다는 은유나 암시를 활용하여 부드럽게 접근하세요.',
        '유머러스': '재미있는 요소나 가벼운 농담을 섞어서 대화하면 좋은 반응을 얻을 수 있습니다.',
        '진지함': '깊이 있고 의미 있는 대화를 선호하므로 진정성 있는 메시지를 전달하세요.',
        '감정적': '감정 표현을 중요하게 생각하므로 마음을 솔직하게 드러내는 것이 효과적입니다.',
        '논리적': '합리적인 근거와 이유를 제시하여 설득력 있게 접근하세요.'
    }
    return advice_map.get(style, '')

def get_response_type(risk_tolerance: float) -> str:
    """위험 허용도에 따른 답변 타입 결정"""
    if risk_tolerance <= 2.0:
        return "안전형"
    elif risk_tolerance >= 3.5:
        return "대담형"
    else:
        return "균형형"

