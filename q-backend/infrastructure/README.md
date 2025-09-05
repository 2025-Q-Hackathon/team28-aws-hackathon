# Love Q Infrastructure - DSQL Edition

Love Q 서비스를 위한 AWS DSQL 기반 완전 서버리스 인프라

## 🏗️ 아키텍처 개요

- **Frontend**: CloudFront + S3 (Next.js)
- **Backend**: API Gateway + Lambda (Python)
- **Database**: Amazon Aurora DSQL (완전 서버리스)
- **Storage**: S3 (AES256 암호화, 7일 자동 삭제)
- **AI**: AWS Bedrock (Claude, Llama)

## 💰 비용 혁신

**DSQL vs RDS Aurora 비교:**
- RDS Aurora Serverless v2: 월 $40+ (최소 0.5 ACU)
- **DSQL: 월 $1-5 (사용량 기반 과금)**
- **90% 비용 절감** 🎉

## 🚀 배포 방법

### 1. DSQL 인프라 배포
```bash
./deploy-dsql.sh dev us-east-1
```

### 2. 데이터베이스 초기화
```bash
# DSQL 클러스터에 스키마 적용
aws dsql execute-statement \
    --cluster-arn <DSQL_CLUSTER_ARN> \
    --sql "$(cat ../src/database/schema.sql)"
```

### 3. Lambda 함수 배포
```bash
../deploy-lambda.sh dev us-east-1
```

## 🔧 DSQL 특장점

**완전 서버리스**
- 최소 용량 제한 없음
- 자동 스케일링 (0 → 무제한)
- 사용한 만큼만 과금

**Love Q 최적화**
- 간헐적 연애 상담 패턴에 완벽
- 피크 시간대 자동 확장
- 유휴 시간 비용 0원

## 📁 파일 구조

```
infrastructure/
├── love-q-serverless.yaml      # 서버리스 기반 CloudFormation
└── deploy-serverless.sh        # 배포 스크립트
```

## 🎯 마이그레이션 완료

- ✅ RDS Aurora → DSQL 전환
- ✅ 90% 비용 절감
- ✅ 완전 서버리스 아키텍처
- ✅ 자동 스케일링
