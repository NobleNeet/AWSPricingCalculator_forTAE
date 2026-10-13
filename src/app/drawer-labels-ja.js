// Display-only wording from AWS Pricing Calculator's ja_JP service screens.
// Source inventory and aggregate-input exceptions: docs/DRAWER_LABELS_JA.md.
// Keys are stable Definition IDs; this module never changes saved values or pricing.
const instance = {
  instanceType: 'インスタンスタイプ', hours: '使用率 (時間/月)', quantity: 'ノード'
};
const capacityFields = { usageMode: '使用量の入力方法', averageAcus: '平均 Aurora 容量単位 (ACU)', computeHours: '計算利用時間 (時間/月)' };
const auroraComponents = {
  'backup-storage': ['追加のバックアップストレージ', { gbMonths: '追加のバックアップストレージ (GB/月)' }],
  'database-insights-limitless': ['Aurora Limitless Database の Database Insights', {
    monitoredAcus: 'Database Insights によってモニタリングされている Aurora キャパシティユニット (ACU) の数', hours: 'モニタリング時間 (時間/月)'
  }],
  instance: ['Aurora PostgreSQL 互換 DB', instance],
  'instance-io-optimized': ['Aurora PostgreSQL I/O 最適化', instance],
  'io-requests': ['Aurora I/O リクエスト', { requests: 'I/O リクエスト数 (件/月)' }],
  'limitless-compute': ['Aurora PostgreSQL Limitless Database', { ...capacityFields, acuHours: 'DB シャードグループの Aurora 容量単位 (ACU) の月間使用量 (ACU 時間/月)' }],
  'serverless-standard': ['Aurora Serverless v2', { ...capacityFields, acuHours: 'Aurora 容量単位 (ACU) の月間使用量 (ACU 時間/月)' }],
  'serverless-io-optimized': ['Aurora Serverless v2 / I/O 最適化', { ...capacityFields, acuHours: 'Aurora 容量単位 (ACU) の月間使用量 (ACU 時間/月)' }],
  'snapshot-export': ['Snapshot Export', { processedGb: 'エクスポート用に処理されたバックアップの合計サイズ (GB)' }],
  storage: ['Aurora ストレージ', { gbMonths: 'ストレージ量 (GB/月)' }],
  'storage-io-optimized': ['Aurora I/O 最適化ストレージ', { gbMonths: 'ストレージ量 (GB/月)' }]
};

export const DRAWER_LABELS_JA = {
  'elastic-load-balancing': {
    "profiles": {
      "standard": "Elastic Load Balancing"
    },
    "fields": {
      "albEnabled": "Application Load Balancer を見積もりに含める",
      "albCount": "Application Load Balancer の数",
      "nlbEnabled": "Network Load Balancer を見積もりに含める",
      "nlbCount": "Network Load Balancer の数",
      "gwlbEnabled": "Gateway Load Balancer を見積もりに含める",
      "gwlbCount": "Gateway Load Balancer の数",
      "clbEnabled": "Classic Load Balancer を見積もりに含める",
      "clbCount": "Classic Load Balancer の数",
      "albTarget": "ALB のターゲットタイプ",
      "albNewConnections": "ALB 毎秒の新しい接続数",
      "albConnectionSeconds": "ALB 平均接続時間 (秒)",
      "albGbHour": "ALB 1時間あたりの処理データ (GB)",
      "albRequests": "ALB 1秒あたりのリクエスト数",
      "albRules": "ALB リクエストあたりのルール評価数",
      "nlbtcpNew": "TCP 1秒あたりの新しい接続/フロー",
      "nlbtcpSeconds": "TCP 接続/フローの平均継続時間 (秒)",
      "nlbtcpBytes": "TCP 接続/フローごとの処理バイト数",
      "nlbudpNew": "UDP 1秒あたりの新しい接続/フロー",
      "nlbudpSeconds": "UDP 接続/フローの平均継続時間 (秒)",
      "nlbudpBytes": "UDP 接続/フローごとの処理バイト数",
      "nlbtlsNew": "TLS 1秒あたりの新しい接続/フロー",
      "nlbtlsSeconds": "TLS 接続/フローの平均継続時間 (秒)",
      "nlbtlsBytes": "TLS 接続/フローごとの処理バイト数",
      "gwlbNew": "GWLB 毎秒の新しい接続/フロー",
      "gwlbSeconds": "GWLB 接続/フローの平均継続時間 (秒)",
      "gwlbGbHour": "GWLB 1時間あたりの処理データ (GB)",
      "gwlbeCount": "Gateway Load Balancer Endpoint の数",
      "gwlbeGbMonth": "Gateway Load Balancer Endpoint 月間処理データ (GB)",
      "clbGbMonth": "Classic Load Balancer 月間処理データ (GB)"
    },
    "components": {
      "alb-hour": [
        "Application Load Balancer 稼働時間"
      ],
      "alb-lcu": [
        "Application Load Balancer LCU"
      ],
      "nlb-hour": [
        "Network Load Balancer 稼働時間"
      ],
      "nlb-tcp": [
        "Network Load Balancer TCP NLCU"
      ],
      "nlb-udp": [
        "Network Load Balancer UDP NLCU"
      ],
      "nlb-tls": [
        "Network Load Balancer TLS NLCU"
      ],
      "gwlb-hour": [
        "Gateway Load Balancer 稼働時間"
      ],
      "gwlb-lcu": [
        "Gateway Load Balancer GLCU"
      ],
      "gwlbe-hour": [
        "Gateway Load Balancer Endpoint 稼働時間"
      ],
      "gwlbe-bytes": [
        "Gateway Load Balancer Endpoint 処理データ"
      ],
      "clb-hour": [
        "Classic Load Balancer 稼働時間"
      ],
      "clb-bytes": [
        "Classic Load Balancer 処理データ"
      ]
    }
  },
  redshift: {
    profiles: { provisioned: 'Redshift', serverless: 'Redshift Serverless' },
    fields: {
      instanceType: 'インスタンスタイプ',
      transferInGb: '特定の宛先へのデータ転送 (IN) (GB)'
    },
    components: {
      'transfer-in': ['Redshift Data Transfer'],
      'node-compute': ['Redshift インスタンスの選択', { nodes: 'ノード', utilization: '使用状況 (オンデマンドのみ) (%utilized/Month)' }],
      spectrum: ['Redshift Spectrum', { scannedTb: 'スキャンしたデータ (TB)' }],
      'rms-provisioned': ['Redshift マネージドストレージ', { managedGb: 'マネージドストレージサイズ (GB)' }],
      'rms-serverless': ['Redshift マネージドストレージ', { managedGb: 'マネージドストレージサイズ (GB)' }],
      'serverless-compute': ['Redshift Serverless', { workloadSize: 'ワークロードのサイズ', baseRpu: 'ベース RPU', runtimeDailyHours: '想定される1日あたりのランタイム (時間)' }],
      'backup-tiered': ['追加のバックアップストレージ', { backupGb: '追加のバックアップストレージ (GB)' }],
      'backup-rg': ['追加のバックアップストレージ', { backupGb: '追加のバックアップストレージ (GB)' }],
      'backup-serverless': ['追加のバックアップストレージ', { backupGb: '追加のバックアップストレージ (GB)' }]
    }
  },
  athena: {
    profiles: { standard: 'Amazon Athena' },
    fields: { sqlPeriod: 'クエリの合計数のユニット', sparkPeriod: 'スパークセッションの合計数のユニット' },
    components: {
      'sql-scanned-day': ['クエリごとの料金が設定された SQL クエリ', { queriesPerMonth: 'クエリの合計数 (件/日)', scannedGbPerQuery: 'クエリごとにスキャンされるデータ量 (GB)' }],
      'sql-scanned-week': ['クエリごとの料金が設定された SQL クエリ', { queriesPerMonth: 'クエリの合計数 (件/週)', scannedGbPerQuery: 'クエリごとにスキャンされるデータ量 (GB)' }],
      'spark-day': ['スパーク', { sessionsPerMonth: 'スパークセッションの合計数 (件/日)', dpuHoursPerSession: 'セッションあたりのコード実行 (DPU 時間)' }],
      'spark-week': ['スパーク', { sessionsPerMonth: 'スパークセッションの合計数 (件/週)', dpuHoursPerSession: 'セッションあたりのコード実行 (DPU 時間)' }],
      'sql-scanned': ['クエリごとの料金が設定された SQL クエリ', { queriesPerMonth: 'クエリの合計数 (件/月)', scannedGbPerQuery: 'クエリごとにスキャンされるデータ量 (GB)' }],
      capacity: ['キャパシティベースの料金が設定された SQL クエリ', { dpus: 'DPU の数', activeHours: 'キャパシティがアクティブである期間 (時間/月)' }],
      spark: ['スパーク', { sessionsPerMonth: 'スパークセッションの合計数 (件/月)', dpuHoursPerSession: 'セッションあたりのコード実行 (DPU 時間)' }]
    }
  },
  ec2: {
    profiles: { standard: '標準' },
    fields: { tenancy: 'テナンシー', os: 'オペレーティングシステム', software: 'プリインストールされたソフトウェア', ebsVolumeType: '各 EC2 インスタンスのストレージ', transferInboundGb: 'インターネットからのデータ転送 (IN) (GB/月)' },
    components: {
      instance: ['EC2 の仕様', { instanceType: 'EC2 インスタンスタイプ', hours: '想定使用量 (時間/月)', quantity: 'インスタンス数' }],
      'dedicated-region-fee': ['専有インスタンスのリージョン料金 (リージョンごとに 1 回)', { hours: '専有インスタンスのリージョン使用時間 (時間/月)' }],
      ebs: ['Amazon Elastic Block Store (EBS) ストレージ', { storageGb: 'ストレージ量 (GB)' }],
      'ebs-gp3-iops': ['汎用 SSD (gp3) - IOPS', { provisionedIops: '汎用 SSD (gp3) - IOPS' }],
      'ebs-gp3-throughput': ['汎用 SSD (gp3) - スループット', { throughputMibps: '汎用 SSD (gp3) - スループット (MiB/s)' }],
      'ebs-io1-iops': ['プロビジョニング IOPS io1', { provisionedIops: 'プロビジョニング IOPS io1' }],
      'ebs-io2-iops': ['プロビジョニング IOPS io2 (第1段階)', { provisionedIops: 'プロビジョニング IOPS io2 (ボリュームあたり)', volumeCount: 'io2 ボリュームの数', volumeHours: 'io2 ボリュームの平均時間 (時間/月)' }],
      'ebs-io2-iops-tier2': ['プロビジョニング IOPS io2 (第2段階)'],
      'ebs-io2-iops-tier3': ['プロビジョニング IOPS io2 (第3段階)'],
      'detailed-monitoring': ['詳細モニタリング', { metricsPerInstance: 'インスタンスあたりの課金対象メトリクス数' }],
      'transfer-internet-out': ['インターネットへのデータ転送 (OUT)', { gbPerMonth: 'データ転送量 (GB/月)' }],
      'transfer-regional': ['リージョン内・AZ間データ転送', { gbPerMonth: 'データ転送量 (GB/月)' }],
      'transfer-interregion': ['リージョン間のデータ転送 (OUT)', { route: '転送元・転送先のリージョン', gbPerMonth: '送信するデータ量 (GB/月)' }]
    }
  },
  ebs: {
    profiles: { standard: '標準' }, fields: { volume: '各 EC2 インスタンスのストレージ' },
    components: {
      storage: ['ストレージ', { gbMonths: 'ストレージ量 (GB/月)' }],
      iops: ['追加のプロビジョニング IOPS', { iopsMonths: '基本料金に含まれる分を超える有料 IOPS (IOPS/月)' }],
      throughput: ['追加のプロビジョニングスループット', { mibpsMonths: '基本料金に含まれる分を超える有料スループット (MiB/s/月)' }]
    }
  },
  s3: {
    profiles: { standard: '標準' }, fields: {},
    components: {
      storage: ['S3 Standard ストレージ', { gbMonths: 'S3 Standard ストレージ (GB/月)' }],
      'write-requests': ['PUT、COPY、POST、LIST リクエスト', { requests: 'S3 Standard に対する PUT、COPY、POST、LIST リクエスト (件/月)' }],
      'read-requests': ['GET、SELECT、およびその他のリクエスト', { requests: 'S3 Standard からの GET、SELECT、および他のすべてのリクエスト (件/月)' }]
    }
  },
  rds: {
    profiles: { standard: '標準' }, fields: { deployment: 'デプロイオプション' },
    components: {
      instance: ['PostgreSQL インスタンスの仕様', { ...instance, hours: '使用状況 (オンデマンドのみ) (時間/月)' }],
      storage: ['ストレージ (gp3)', { gbMonths: '合計ストレージ量 (GB/月)', usageMode: '使用量の入力方法', capacityGb: 'DB 1 台あたりのストレージ量 (GiB)', storageHours: 'ストレージ利用時間 (時間/月)' }]
    }
  },
  'rds-oracle': {
    profiles: { standard: 'Amazon RDS for Oracle' },
    fields: {
      nodes: 'ノード', utilizationPct: '使用状況 (オンデマンドのみ) (%/月)',
      deployment: 'デプロイオプション', licenseModel: 'ライセンス', databaseEdition: 'データベース版'
    },
    components: {
      instance: ['RDS for Oracle インスタンスを選択', { instanceType: 'インスタンスタイプ' }],
      'storage-gp3': ['ストレージ', { volumeType: '各 RDS インスタンスのストレージ', gbMonths: 'ストレージ量 (DB インスタンス 1 台あたりの GB)' }],
      'database-insights': ['RDS プロビジョンドインスタンスの CloudWatch Database Insights の料金'],
      'backup-storage': ['バックアップストレージ', { additionalGbMonths: '追加のバックアップストレージ (GB/月)' }]
    }
  },
  'aurora-postgresql': {
    profiles: {
      'provisioned-standard': 'プロビジョニング済み / Aurora Standard',
      'provisioned-io-optimized': 'プロビジョニング済み / Aurora I/O 最適化',
      'serverless-standard': 'Serverless v2 / Aurora Standard',
      'serverless-io-optimized': 'Serverless v2 / Aurora I/O 最適化',
      'limitless-io-optimized': 'Aurora PostgreSQL Limitless Database'
    }, fields: {}, components: auroraComponents
  },
  fargate: {
    profiles: { standard: 'Fargate オンデマンド' },
    fields: {
      operatingSystem: 'オペレーティングシステム', cpuArchitecture: 'CPU アーキテクチャ',
      tasksPerDay: 'タスクまたはポッドの数 (件/日)', averageDurationHours: '平均期間 (時間)',
      linuxVcpuPerTask: '割り当てられた vCPU の量', windowsVcpuPerTask: '割り当てられた vCPU の量',
      linuxMemoryGbPerTask: '割り当てたメモリ量 (GB)', windowsMemoryGbPerTask: '割り当てたメモリ量 (GB)',
      ephemeralStorageGb: 'Amazon ECS に割り当てられたエフェメラルストレージの量 (GB)'
    },
    components: {
      'linux-x86-vcpu': ['Linux x86 vCPU'], 'linux-arm-vcpu': ['Linux ARM vCPU'],
      'linux-x86-memory': ['Linux x86 メモリ'], 'linux-arm-memory': ['Linux ARM メモリ'],
      'windows-vcpu': ['Windows vCPU'], 'windows-memory': ['Windows メモリ'], 'windows-os': ['Windows OS ライセンス'],
      'linux-ephemeral-storage': ['追加のエフェメラルストレージ (Linux)'],
      'windows-ephemeral-storage': ['追加のエフェメラルストレージ (Windows)']
    }
  },
  lambda: {
    profiles: { standard: 'Lambda 関数' },
    fields: {
      architecture: 'アーキテクチャ', ephemeralStorageMb: '割り当てられたエフェメラルストレージの量 (MB)',
      requestsPerMonth: 'リクエストの数 (件/月)', averageDurationMs: '各リクエストの実行時間 (ミリ秒単位)', memoryMb: '割り当てたメモリ量 (MB)',
      provisionedArchitecture: 'アーキテクチャ (プロビジョニングされた同時実行性)', provisionedConcurrency: '同時実行性',
      provisionedHoursPerMonth: 'プロビジョニングされた同時実行が有効になっている時間 (時間/月)',
      provisionedRequestsPerMonth: 'プロビジョニングされた同時実行のリクエスト数 (件/月)',
      provisionedAverageDurationMs: 'プロビジョニングされた各リクエストの所要時間（ミリ秒）',
      provisionedMemoryMb: '割り当てたメモリ量 (プロビジョニングされた同時実行性、MB)',
      invokeMode: '呼び出しモード', averageStreamedResponseMb: '平均レスポンスペイロードサイズ (MB)'
    },
    components: {
      duration: ['コンピューティング実行時間'], requests: ['リクエスト'],
      'ephemeral-storage-arm': ['オンデマンドのエフェメラルストレージ'], 'ephemeral-storage-x86': ['オンデマンドのエフェメラルストレージ'],
      'provisioned-capacity-arm': ['プロビジョニングされた同時実行性の容量'], 'provisioned-capacity-x86': ['プロビジョニングされた同時実行性の容量'],
      'provisioned-duration-arm': ['プロビジョニングされた同時実行の実行時間'], 'provisioned-duration-x86': ['プロビジョニングされた同時実行の実行時間'],
      'provisioned-requests': ['プロビジョニングされた同時実行のリクエスト'],
      'response-streaming-arm': ['Lambda HTTP レスポンスストリーミング'], 'response-streaming-x86': ['Lambda HTTP レスポンスストリーミング']
    }
  },
  codebuild: {
    profiles: { 'on-demand-ec2': 'オンデマンド EC2' }, fields: { operatingSystem: 'オペレーティングシステム' },
    components: { 'build-minutes': ['AWS CodeBuild', {
      computeType: 'インスタンスタイプを検索', durationUnit: 'ユニット', buildsPerMonth: '1 か月あたりのビルド数', averageBuildMinutes: '平均ビルド時間 (分)'
    }] }
  },
  kms: {
    profiles: { standard: 'KMS' }, fields: {},
    components: {
      'key-versions': ['カスタマー管理型のカスタマーマスターキー (CMK)', { billableKeyVersions: 'カスタマー管理型のカスタマーマスターキー (CMK) の数' }],
      'requests-standard': ['対称リクエスト', { requests: '対称リクエストの数' }],
      'requests-asymmetric': ['RSA 2048 以外の非対称リクエスト', { requests: 'RSA 2048 以外の非対称リクエストの数' }],
      'requests-asymmetric-rsa2048': ['RSA 2048 に関連する非対称リクエスト', { requests: 'RSA 2048 に関連する非対称リクエストの数' }],
      'requests-generate-data-key-pair-ecc': ['ECC GenerateDataKeyPair リクエスト', { requests: 'ECC GenerateDataKeyPair リクエストの数' }],
      'requests-generate-data-key-pair-rsa': ['RSA GenerateDataKeyPair リクエスト', { requests: 'RSA GenerateDataKeyPair リクエストの数' }]
    }
  },
  eventbridge: {
    profiles: { standard: 'EventBridge' },
    fields: {
      payloadSizeKb: 'ペイロードのサイズ (KB)', awsManagementEventsMillions: 'AWS 管理イベントの数 (100 万件/月)',
      awsOptInDataEventsMillions: 'AWS オプトインデータイベントの数 (100 万件/月)', customEventsMillions: 'カスタムイベントの数 (100 万件/月)',
      partnerEventsMillions: 'パートナーイベントの数 (100 万件/月)',
      crossAccountManagementEventsMillions: '別のアカウントのサービスに配信されたイベントの数 (AWS 管理イベント、100 万件/月)',
      crossAccountCustomEventsMillions: '別のイベントバスに配信されたイベントの数 (カスタムイベント、100 万件/月)',
      crossAccountPartnerEventsMillions: '別のアカウントのサービスに配信されたイベントの数 (パートナーイベント、100 万件/月)',
      apiDestinationInvocationsMillions: '呼び出しの数 (API 送信先、100 万件/月)', replayedEventsMillions: '再生されたイベントの数 (100 万件/月)',
      archiveEventsMillions: 'イベントの数 (アーカイブ処理、100 万件/月)', archiveStorageGbMonth: 'アーカイブストレージ量 (GB/月)',
      pipesRequestsMillions: 'リクエストの数 (EventBridge Pipes、フィルタリング後、100 万件/月)',
      schemaDiscoveryEventsMillions: 'イベントの数 (スキーマの検出、100 万件/月)', schedulerInvocationsMillions: '呼び出しの数 (EventBridge スケジューラ、100 万件/月)'
    },
    components: {
      'api-destinations': ['API 送信先'], 'archive-processing': ['イベントの再生 - アーカイブ処理'], 'archive-storage': ['イベントの再生 - アーカイブストレージ'],
      'cross-account-custom-delivery': ['カスタムイベントの別のイベントバスへの配信'],
      'cross-account-management-delivery': ['AWS 管理イベントの別のアカウントへの配信'],
      'cross-account-partner-delivery': ['パートナーイベントの別のアカウントへの配信'],
      'custom-events-ingestion': ['カスタムイベントの取り込み'], 'opt-in-data-events-ingestion': ['AWS オプトインデータイベントの取り込み'],
      'partner-events-ingestion': ['パートナーイベントの取り込み'], pipes: ['EventBridge Pipes'],
      'replayed-events': ['再生されたイベント'], scheduler: ['EventBridge スケジューラ'], 'schema-discovery': ['スキーマの検出']
    }
  },
  amplify: {
    profiles: { standard: 'ウェブアプリのホスティング' }, fields: {},
    components: {
      'build-standard': ['ビルドの分数 - Standard'], 'build-large': ['ビルドの分数 - Large'], 'build-xlarge': ['ビルドの分数 - XLarge'],
      'data-storage': ['データストレージ'], 'data-transfer-out': ['データ転送 (アウト)'],
      'ssr-request-count': ['SSR リクエストの数'], 'ssr-request-duration': ['SSR リクエストの実行時間']
    }
  },
  'systems-manager': {
    profiles: { standard: 'AWS Systems Manager' }, fields: {},
    components: { 'incident-response-plans': ['Incident Manager の対応プラン'], 'jit-node-hours': ['ジャストインタイムノードアクセス'] }
  },
  glue: {
    profiles: { standard: 'AWS Glue' },
    fields: {
      etlJobs: 'AWS Glue ETL ジョブ',
      interactiveSessions: 'AWS Glue インタラクティブセッション',
      developmentEndpoints: 'AWS Glue 開発エンドポイント',
      dataCatalog: 'AWS Glue Data Catalog',
      crawlers: 'AWS Glue クローラー',
      dataBrewInteractiveSessions: 'AWS Glue DataBrew インタラクティブセッション',
      dataBrewJobs: 'AWS Glue DataBrew ジョブ',
      dataQuality: 'AWS Glue Data Quality',
      zeroEtl: 'AWS Glue ゼロ ETL'
    },
    components: {
      'etl-standard': ['ETL ジョブ', { pricingGroup: 'AWS Glue バージョン / 実行クラス', runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの DPU 数', averageDurationMinutes: '平均実行時間 (分)' }],
      'etl-memory-gen2': ['メモリ最適化 ETL ジョブ (Glue 6.0+)', { runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの DPU 数', averageDurationMinutes: '平均実行時間 (分)' }],
      'etl-memory-legacy': ['メモリ最適化 ETL ジョブ', { runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの M-DPU 数', averageDurationMinutes: '平均実行時間 (分)' }],
      'etl-ray': ['AWS Glue for Ray ジョブ', { runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの M-DPU 数', averageDurationMinutes: '平均実行時間 (分)' }],
      'interactive-standard': ['インタラクティブセッション', { pricingGroup: 'AWS Glue バージョン', runsPerMonth: '1 か月あたりのセッション数', dpusPerRun: 'セッションあたりの DPU 数', averageDurationMinutes: '平均セッション時間 (分)' }],
      'interactive-ray': ['AWS Glue for Ray インタラクティブセッション', { runsPerMonth: '1 か月あたりのセッション数', dpusPerRun: 'セッションあたりの M-DPU 数', averageDurationMinutes: '平均セッション時間 (分)' }],
      'development-endpoints': ['開発エンドポイント', { runsPerMonth: '1 か月あたりの起動回数', dpusPerRun: 'エンドポイントあたりの DPU 数', averageDurationMinutes: '平均稼働時間 (分)' }],
      'catalog-requests': ['Data Catalog リクエスト', { requestsPerMonth: '1 か月あたりのリクエスト数' }],
      'catalog-storage': ['Data Catalog ストレージ', { objectsPerMonth: '保存するオブジェクト数 (オブジェクト/月)' }],
      'catalog-statistics': ['Data Catalog 列統計', { runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの DPU 数', averageDurationMinutes: '平均実行時間 (分)' }],
      'catalog-optimization': ['Data Catalog テーブル最適化', { runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの DPU 数', averageDurationMinutes: '平均実行時間 (分)' }],
      'materialized-view-refresh': ['マテリアライズドビューの更新', { runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの DPU 数', averageDurationMinutes: '平均実行時間 (分)' }],
      crawlers: ['クローラー', { runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの DPU 数', averageDurationMinutes: '平均実行時間 (分)' }],
      'databrew-sessions': ['DataBrew インタラクティブセッション', { sessionsPerMonth: '1 か月あたりのセッション数' }],
      'databrew-jobs': ['DataBrew ジョブ', { runsPerMonth: '1 か月あたりの実行回数', nodesPerRun: '実行あたりのノード数', averageDurationMinutes: '平均実行時間 (分)' }],
      'data-quality': ['AWS Glue Data Quality', { runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの DPU 数', averageDurationMinutes: '平均実行時間 (分)' }],
      'zero-etl-ingestion': ['ゼロ ETL データ取り込み', { ingestedGbPerMonth: '1 か月あたりの取り込みデータ量 (GB)' }],
      'zero-etl-compute': ['ゼロ ETL コンピューティング', { runsPerMonth: '1 か月あたりの実行回数', dpusPerRun: '実行あたりの DPU 数', averageDurationMinutes: '平均実行時間 (分)' }]
    }
  }
};

// Create a view of the Definition package, preserving all pricing/validation
// metadata and leaving the cached original package untouched.
export function japaneseDrawerPackage(pkg) {
  const labels = DRAWER_LABELS_JA[pkg.service.id];
  if (!labels) return pkg;
  const fields = (inputs, names = {}) => inputs.map(input => ({ ...input, label: names[input.id] ?? input.label,
    ...(input.id === 'usageMode' ? { options: { ...input.options, label: { capacity: '容量・利用時間から計算', aggregate: '月間合計使用量を直接入力 (詳細)' } } } : {})
  }));
  return {
    ...pkg,
    profiles: Object.fromEntries(Object.entries(pkg.profiles).map(([id, profile]) => [id, {
      ...profile, label: labels.profiles[id] ?? profile.label, selectors: fields(profile.selectors, labels.fields)
    }])),
    components: Object.fromEntries(Object.entries(pkg.components).map(([id, component]) => [id, {
      ...component, label: labels.components[id]?.[0] ?? component.label,
      selectors: fields(component.selectors, labels.components[id]?.[1]),
      usageInputs: fields(component.usageInputs, labels.components[id]?.[1])
    }]))
  };
}
