import json
import boto3
import os
from typing import Dict, List, Any

# AWS 서비스 클라이언트
comprehend = boto3.client('comprehend')

def lambda_handler(event, context):
    """감정 분석 전용 Lambda 함수"""
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
        text = body.get('text', '')
        
        if not text.strip():
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Text is required'})
            }
        
        # 감정 분석 수행
        emotion_result = analyze_comprehensive_emotion(text)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(emotion_result)
        }
        
    except Exception as e:
        print(f"Emotion analysis error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def analyze_comprehensive_emotion(text: str) -> Dict[str, Any]:
    """종합적인 감정 분석"""
    try:
        # 텍스트 길이 제한 (Comprehend 제한)
        text = text[:5000]
        
        # 1. 감정 분석 (Sentiment Analysis)
        sentiment_response = comprehend.detect_sentiment(
            Text=text,
            LanguageCode='ko'
        )
        
        # 2. 핵심 구문 추출 (Key Phrases)
        try:
            key_phrases_response = comprehend.detect_key_phrases(
                Text=text,
                LanguageCode='ko'
            )
            key_phrases = [phrase['Text'] for phrase in key_phrases_response['KeyPhrases'][:5]]
        except:
            key_phrases = []
        
        # 3. 개체명 인식 (Named Entity Recognition)
        try:
            entities_response = comprehend.detect_entities(
                Text=text,
                LanguageCode='ko'
            )
            entities = [
                {
                    'text': entity['Text'],
                    'type': entity['Type'],
                    'confidence': entity['Score']
                }
                for entity in entities_response['Entities'][:5]
            ]
        except:
            entities = []
        
        # 4. 감정 강도 계산
        sentiment_scores = sentiment_response['SentimentScore']
        dominant_emotion = max(sentiment_scores.items(), key=lambda x: x[1])
        
        # 5. 감정 카테고리 매핑
        emotion_category = map_emotion_category(
            sentiment_response['Sentiment'], 
            dominant_emotion[1]
        )
        
        return {
            'sentiment': sentiment_response['Sentiment'],
            'sentiment_confidence': dominant_emotion[1],
            'sentiment_scores': sentiment_scores,
            'emotion_category': emotion_category,
            'emotion_intensity': calculate_emotion_intensity(sentiment_scores),
            'key_phrases': key_phrases,
            'entities': entities,
            'analysis_summary': generate_emotion_summary(
                sentiment_response['Sentiment'], 
                dominant_emotion[1], 
                key_phrases
            )
        }
        
    except Exception as e:
        print(f"Comprehensive emotion analysis error: {e}")
        # 폴백 응답
        return {
            'sentiment': 'NEUTRAL',
            'sentiment_confidence': 0.5,
            'sentiment_scores': {'Neutral': 1.0},
            'emotion_category': 'calm',
            'emotion_intensity': 'medium',
            'key_phrases': [],
            'entities': [],
            'analysis_summary': '감정 분석을 완료할 수 없습니다.'
        }

def map_emotion_category(sentiment: str, confidence: float) -> str:
    """감정을 더 세분화된 카테고리로 매핑"""
    if sentiment == 'POSITIVE':
        if confidence > 0.8:
            return 'excited'  # 흥분된
        elif confidence > 0.6:
            return 'happy'    # 행복한
        else:
            return 'pleased'  # 만족한
    elif sentiment == 'NEGATIVE':
        if confidence > 0.8:
            return 'upset'    # 화난
        elif confidence > 0.6:
            return 'sad'      # 슬픈
        else:
            return 'worried'  # 걱정되는
    elif sentiment == 'MIXED':
        return 'conflicted'   # 복잡한
    else:
        return 'calm'         # 평온한

def calculate_emotion_intensity(sentiment_scores: Dict[str, float]) -> str:
    """감정 강도 계산"""
    max_score = max(sentiment_scores.values())
    
    if max_score > 0.8:
        return 'high'
    elif max_score > 0.6:
        return 'medium'
    else:
        return 'low'

def generate_emotion_summary(sentiment: str, confidence: float, key_phrases: List[str]) -> str:
    """감정 분석 요약 생성"""
    confidence_text = "높은" if confidence > 0.7 else "보통" if confidence > 0.5 else "낮은"
    
    sentiment_map = {
        'POSITIVE': '긍정적',
        'NEGATIVE': '부정적', 
        'NEUTRAL': '중립적',
        'MIXED': '복합적'
    }
    
    sentiment_korean = sentiment_map.get(sentiment, '알 수 없는')
    
    summary = f"{confidence_text} 신뢰도로 {sentiment_korean} 감정이 감지되었습니다."
    
    if key_phrases:
        summary += f" 주요 키워드: {', '.join(key_phrases[:3])}"
    
    return summary