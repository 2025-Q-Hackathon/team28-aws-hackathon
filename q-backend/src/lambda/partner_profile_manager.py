import json
import boto3
import os
from typing import Dict, Any, List
from datetime import datetime

# AWS 서비스 클라이언트
dsql_client = boto3.client('dsql')

def lambda_handler(event, context):
    """상대방 프로필 관리 Lambda 함수"""
    try:
        # CORS 헤더
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        # OPTIONS 요청 처리
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # HTTP 메서드에 따른 처리
        method = event.get('httpMethod', 'POST')
        
        if method == 'POST':
            return create_partner_profile(event, headers)
        elif method == 'GET':
            return get_partner_profiles(event, headers)
        elif method == 'PUT':
            return update_partner_profile(event, headers)
        elif method == 'DELETE':
            return delete_partner_profile(event, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
            
    except Exception as e:
        print(f"Partner profile manager error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def create_partner_profile(event, headers):
    """상대방 프로필 생성"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        # 필수 필드 검증
        required_fields = ['user_id', 'name', 'relationship']
        for field in required_fields:
            if not body.get(field):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'{field} is required'})
                }
        
        # 상대방 정보 분석
        partner_analysis = analyze_partner_info(body)
        
        # 데이터베이스에 저장
        profile_id = save_partner_profile(body, partner_analysis)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'profile_id': profile_id,
                'analysis': partner_analysis,
                'message': 'Partner profile created successfully'
            })
        }
        
    except Exception as e:
        print(f"Create partner profile error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def get_partner_profiles(event, headers):
    """사용자의 상대방 프로필 목록 조회"""
    try:
        user_id = event.get('queryStringParameters', {}).get('user_id')
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id is required'})
            }
        
        profiles = fetch_partner_profiles(user_id)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'profiles': profiles})
        }
        
    except Exception as e:
        print(f"Get partner profiles error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def update_partner_profile(event, headers):
    """상대방 프로필 업데이트"""
    try:
        body = json.loads(event.get('body', '{}'))
        profile_id = body.get('profile_id')
        
        if not profile_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'profile_id is required'})
            }
        
        # 상대방 정보 재분석
        partner_analysis = analyze_partner_info(body)
        
        # 데이터베이스 업데이트
        update_partner_profile_db(profile_id, body, partner_analysis)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'profile_id': profile_id,
                'analysis': partner_analysis,
                'message': 'Partner profile updated successfully'
            })
        }
        
    except Exception as e:
        print(f"Update partner profile error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def delete_partner_profile(event, headers):
    """상대방 프로필 삭제"""
    try:
        body = json.loads(event.get('body', '{}'))
        profile_id = body.get('profile_id')
        
        if not profile_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'profile_id is required'})
            }
        
        delete_partner_profile_db(profile_id)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Partner profile deleted successfully'})
        }
        
    except Exception as e:
        print(f"Delete partner profile error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def analyze_partner_info(partner_data: Dict) -> Dict[str, Any]:
    """상대방 정보 분석 및 인사이트 생성"""
    analysis = {
        'personality_traits': [],
        'communication_preferences': [],
        'relationship_advice': [],
        'conversation_topics': [],
        'approach_strategy': '',
        'risk_factors': [],
        'compatibility_score': 0.0
    }
    
    description = partner_data.get('description', '').lower()
    interests = partner_data.get('interests', '').lower()
    communication_style = partner_data.get('communication_style', '')
    relationship = partner_data.get('relationship', '')
    
    # 성격 특성 분석
    personality_patterns = {
        '내성적': ['내성적', '조용', '수줍', '소심', '혼자'],
        '외향적': ['외향적', '활발', '사교적', '적극적', '사람'],
        '감성적': ['감성적', '감정적', '로맨틱', '섬세', '예술'],
        '논리적': ['논리적', '이성적', '분석적', '체계적', '계획'],
        '유머러스': ['유머', '재미있', '웃긴', '장난', '개그'],
        '진지함': ['진지', '성실', '책임감', '신중', '깊이'],
        '독립적': ['독립적', '자립적', '혼자', '개인주의'],
        '배려심': ['배려', '친절', '따뜻', '상냥', '도움'],
        '완벽주의': ['완벽', '꼼꼼', '세심', '정확', '철저'],
        '자유로움': ['자유', '즉흥', '유연', '개방적', '모험']
    }
    
    for trait, keywords in personality_patterns.items():
        if any(keyword in description or keyword in interests for keyword in keywords):
            analysis['personality_traits'].append(trait)
    
    # 소통 선호도 분석
    if communication_style:
        comm_preferences = {
            '직설적': ['명확한 의사소통', '솔직한 대화', '직접적 표현'],
            '간접적': ['은유적 표현', '암시적 소통', '부드러운 접근'],
            '유머러스': ['재미있는 대화', '가벼운 농담', '유쾌한 분위기'],
            '진지함': ['깊이 있는 대화', '의미 있는 주제', '진정성'],
            '감정적': ['감정 표현', '공감적 소통', '마음 나누기'],
            '논리적': ['합리적 대화', '근거 제시', '체계적 설명']
        }
        
        if communication_style in comm_preferences:
            analysis['communication_preferences'] = comm_preferences[communication_style]
    
    # 관심사 기반 대화 주제 추천
    interest_topics = extract_conversation_topics(interests)
    analysis['conversation_topics'] = interest_topics
    
    # 관계별 접근 전략
    relationship_strategies = {
        '썸': {
            'strategy': '관심을 보이되 부담스럽지 않게, 공통 관심사를 통한 자연스러운 접근',
            'advice': ['너무 적극적이지 말고 적당한 거리감 유지', '공통 관심사로 대화 시작', '상대방 반응 살피며 단계적 접근']
        },
        '소개팅': {
            'strategy': '진정성 있는 관심 표현, 상대방을 알아가려는 자세',
            'advice': ['첫인상이 중요하므로 정중하고 예의바른 태도', '상대방 이야기에 집중', '공통점 찾기 노력']
        },
        '연인': {
            'strategy': '깊은 소통과 감정 표현, 관계 발전을 위한 노력',
            'advice': ['솔직한 감정 표현', '상대방 입장 이해하기', '함께하는 시간의 소중함 표현']
        },
        '친구': {
            'strategy': '편안하고 자연스러운 소통, 우정을 바탕으로 한 접근',
            'advice': ['편안한 분위기 조성', '서로의 관심사 공유', '부담 없는 만남 제안']
        }
    }
    
    if relationship in relationship_strategies:
        strategy_info = relationship_strategies[relationship]
        analysis['approach_strategy'] = strategy_info['strategy']
        analysis['relationship_advice'] = strategy_info['advice']
    
    # 위험 요소 분석
    risk_keywords = ['바쁨', '스트레스', '피곤', '힘들', '우울', '예민', '까다로움']
    for keyword in risk_keywords:
        if keyword in description:
            analysis['risk_factors'].append(f"'{keyword}' 상태 - 신중한 접근 필요")
    
    # 호환성 점수 계산 (간단한 알고리즘)
    compatibility_score = calculate_compatibility_score(partner_data, analysis)
    analysis['compatibility_score'] = compatibility_score
    
    return analysis

def extract_conversation_topics(interests: str) -> List[str]:
    """관심사에서 대화 주제 추출"""
    topics = []
    
    topic_mapping = {
        '영화': ['최근 본 영화', '좋아하는 장르', '영화관 vs 집에서 보기'],
        '음악': ['좋아하는 가수', '콘서트 경험', '음악 취향'],
        '독서': ['최근 읽은 책', '좋아하는 작가', '독서 습관'],
        '운동': ['운동 종목', '헬스장 vs 야외운동', '운동 루틴'],
        '여행': ['가고 싶은 곳', '여행 스타일', '여행 경험'],
        '요리': ['좋아하는 음식', '요리 실력', '맛집 탐방'],
        '게임': ['즐기는 게임', '게임 시간', '게임 취향'],
        '드라마': ['최근 본 드라마', '좋아하는 장르', '드라마 추천'],
        '카페': ['좋아하는 카페', '커피 vs 차', '카페 분위기'],
        '쇼핑': ['쇼핑 스타일', '좋아하는 브랜드', '온라인 vs 오프라인']
    }
    
    for interest, topic_list in topic_mapping.items():
        if interest in interests:
            topics.extend(topic_list)
    
    return topics[:10]  # 최대 10개

def calculate_compatibility_score(partner_data: Dict, analysis: Dict) -> float:
    """호환성 점수 계산"""
    score = 0.5  # 기본 점수
    
    # 성격 특성 다양성 (긍정적)
    personality_count = len(analysis['personality_traits'])
    if personality_count >= 3:
        score += 0.1
    
    # 관심사 다양성 (긍정적)
    interests = partner_data.get('interests', '')
    if len(interests.split(',')) >= 3:
        score += 0.1
    
    # 소통 스타일 명확성 (긍정적)
    if partner_data.get('communication_style'):
        score += 0.1
    
    # 상세 설명 충실도 (긍정적)
    description_length = len(partner_data.get('description', ''))
    if description_length > 100:
        score += 0.1
    elif description_length > 50:
        score += 0.05
    
    # 위험 요소 (부정적)
    risk_count = len(analysis['risk_factors'])
    score -= risk_count * 0.05
    
    return min(max(score, 0.0), 1.0)

def save_partner_profile(partner_data: Dict, analysis: Dict) -> str:
    """상대방 프로필을 데이터베이스에 저장"""
    try:
        # 실제 구현에서는 DSQL을 사용
        # 여기서는 간단한 ID 생성
        profile_id = f"partner_{partner_data['user_id']}_{int(datetime.now().timestamp())}"
        
        # TODO: DSQL에 실제 저장 로직 구현
        print(f"Saving partner profile: {profile_id}")
        print(f"Partner data: {partner_data}")
        print(f"Analysis: {analysis}")
        
        return profile_id
        
    except Exception as e:
        print(f"Save partner profile error: {e}")
        raise

def fetch_partner_profiles(user_id: str) -> List[Dict]:
    """사용자의 상대방 프로필 목록 조회"""
    try:
        # TODO: DSQL에서 실제 조회 로직 구현
        # 임시 데이터 반환
        return []
        
    except Exception as e:
        print(f"Fetch partner profiles error: {e}")
        raise

def update_partner_profile_db(profile_id: str, partner_data: Dict, analysis: Dict):
    """상대방 프로필 업데이트"""
    try:
        # TODO: DSQL 업데이트 로직 구현
        print(f"Updating partner profile: {profile_id}")
        
    except Exception as e:
        print(f"Update partner profile error: {e}")
        raise

def delete_partner_profile_db(profile_id: str):
    """상대방 프로필 삭제"""
    try:
        # TODO: DSQL 삭제 로직 구현
        print(f"Deleting partner profile: {profile_id}")
        
    except Exception as e:
        print(f"Delete partner profile error: {e}")
        raise