import json
import re
import boto3
import os
from typing import Dict, List, Any

# AWS 서비스 클라이언트
comprehend = boto3.client('comprehend')
lambda_client = boto3.client('lambda')

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
        speech_analysis = analyze_speech_style(messages)
        
        # 감정 분석 수행 (Comprehend)
        emotion_analysis = analyze_emotions(messages)
        
        # 결과 결합
        combined_result = {
            **speech_analysis,
            'emotion_data': emotion_analysis,
            'personality_traits': extract_personality_traits(speech_analysis, emotion_analysis),
            'response_examples': generate_response_examples(messages[:3])  # 처음 3개 메시지만
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(combined_result)
        }
        
    except Exception as e:
        print(f"Speech analysis error: {e}")
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

def analyze_emotions(messages: List[str]) -> Dict[str, Any]:
    """Comprehend를 사용한 감정 분석"""
    try:
        # 메시지들을 하나의 텍스트로 결합 (최대 5000자 제한)
        combined_text = ' '.join(messages)[:5000]
        
        if not combined_text.strip():
            return {
                'sentiment': 'NEUTRAL',
                'sentiment_confidence': 0.5,
                'emotions': {'neutral': 1.0}
            }
        
        # Comprehend 감정 분석
        sentiment_response = comprehend.detect_sentiment(
            Text=combined_text,
            LanguageCode='ko'  # 한국어
        )
        
        return {
            'sentiment': sentiment_response['Sentiment'],
            'sentiment_confidence': max(sentiment_response['SentimentScore'].values()),
            'emotions': sentiment_response['SentimentScore']
        }
        
    except Exception as e:
        print(f"Emotion analysis error: {e}")
        # 폴백: 기본 감정 분석
        return {
            'sentiment': 'NEUTRAL',
            'sentiment_confidence': 0.5,
            'emotions': {'neutral': 1.0}
        }

def extract_personality_traits(speech_data: Dict, emotion_data: Dict) -> List[str]:
    """말투와 감정 데이터를 기반으로 성격 특성 추출"""
    traits = []
    
    # 말투 기반 특성
    if speech_data['formal_ratio'] > 0.7:
        traits.append('정중함')
    elif speech_data['formal_ratio'] < 0.3:
        traits.append('친근함')
    
    if speech_data['emoji_ratio'] > 0.5:
        traits.append('표현력 풍부')
    elif speech_data['emoji_ratio'] < 0.1:
        traits.append('간결함')
    
    if speech_data['avg_length'] > 50:
        traits.append('상세함')
    elif speech_data['avg_length'] < 15:
        traits.append('간단명료')
    
    # 감정 기반 특성
    sentiment = emotion_data.get('sentiment', 'NEUTRAL')
    if sentiment == 'POSITIVE':
        traits.append('긍정적')
    elif sentiment == 'NEGATIVE':
        traits.append('신중함')
    
    return traits[:5]  # 최대 5개 특성

def generate_response_examples(messages: List[str]) -> List[str]:
    """사용자 메시지 스타일을 기반으로 응답 예시 생성"""
    if not messages:
        return ['안녕!', '좋아!', '그렇구나~']
    
    examples = []
    for msg in messages[:3]:
        if len(msg) > 5:  # 너무 짧은 메시지는 제외
            examples.append(msg)
    
    # 부족하면 기본 예시 추가
    while len(examples) < 3:
        examples.extend(['네!', '좋아요', '그렇네요'])
    
    return examples[:3]
