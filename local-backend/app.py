from flask import Flask, request, jsonify
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

def analyze_speech_style(messages):
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
    
    # 존댓말 패턴
    formal_patterns = ['요', '습니다', '해요', '입니다', '세요', '시죠', '죠']
    formal_count = sum(1 for msg in messages 
                      if any(pattern in msg for pattern in formal_patterns))
    
    # 이모티콘 분석
    emoji_count = 0
    for msg in messages:
        emoji_count += len(re.findall(r'ㅋ+|ㅎ+|ㅠ+|ㅜ+', msg))
        emoji_count += len(re.findall(r'😀|😁|😂|😃|😄|😅|😆|😊|😋|😍|😘|😜|😝|😛|😎|😢|😭|😰|😱', msg))
        emoji_count += len(re.findall(r':\)|:\(|:D|XD|><|T_T|\^\^', msg))
    
    # 평균 길이
    avg_length = sum(len(msg) for msg in messages) / total_msgs
    
    formal_ratio = formal_count / total_msgs
    
    return {
        "formal_ratio": formal_ratio,
        "emoji_ratio": emoji_count / total_msgs,
        "avg_length": avg_length,
        "total_messages": total_msgs,
        "tone": "positive",
        "speech_style": "formal" if formal_ratio > 0.3 else "casual"
    }

@app.route('/analyze-speech', methods=['POST'])
def analyze_speech():
    data = request.json
    messages = data.get('messages', [])
    result = analyze_speech_style(messages)
    return jsonify(result)

@app.route('/analyze', methods=['POST'])
def generate_responses():
    data = request.json
    user_style = data.get('user_style', {})
    
    is_formal = user_style.get('formal_ratio', 0) > 0.3
    use_emoji = user_style.get('emoji_ratio', 0) > 0.2
    
    responses = [
        {
            "type": "안전형",
            "message": "그렇군요! 좋네요 😊" if is_formal and use_emoji else 
                      "그렇군요! 좋네요" if is_formal else
                      "그렇구나! 좋다 ㅎㅎ" if use_emoji else "그렇구나! 좋네",
            "explanation": "무난하고 안전한 반응으로 부담을 주지 않습니다.",
            "risk_level": 1,
            "confidence": 0.9
        },
        {
            "type": "표준형",
            "message": "오 좋은데요? 저도 관심있어요! 😄" if is_formal and use_emoji else
                      "오 좋은데요? 저도 관심있어요!" if is_formal else
                      "오 좋은데? 나도 관심있어! 😊" if use_emoji else "오 좋은데? 나도 관심있어!",
            "explanation": "적당한 관심을 표현하며 대화를 이어갑니다.",
            "risk_level": 2,
            "confidence": 0.8
        },
        {
            "type": "대담형",
            "message": "완전 좋아요! 같이 해볼까요? 😍" if is_formal and use_emoji else
                      "완전 좋아요! 같이 해볼까요?" if is_formal else
                      "완전 좋아! 같이 해볼까? 😍" if use_emoji else "완전 좋아! 같이 해볼까?",
            "explanation": "적극적인 호감을 드러내며 함께하고 싶다는 의사를 표현합니다.",
            "risk_level": 4,
            "confidence": 0.7
        }
    ]
    
    return jsonify({"responses": responses})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)