# ImageAssetDepot

`ImageAssetDepot`は、Node.jsとExpressを使って構築されたシンプルな画像管理・配信サーバーです。Docker/Podmanと永続ボリューム（PV）を利用することで、クリーンな開発環境とデータの永続化を実現します。

## 🚀 特徴

- **画像管理**: 管理画面から画像をアップロード、削除、重み付け管理ができます。
- **重み付け配信**: 設定された重みに基づいて、画像をランダムに配信します。
- **コンテナ対応**: Red Hat UBIベースのコンテナで動作し、OpenShiftへのデプロイを前提としています。
- **データ永続化**: データベースファイルと画像は永続ボリュームに保存されます。

---

## 💻 開発環境のセットアップ

このプロジェクトは、VS Codeの**Dev Containers**と**Podman/Docker**を前提としています。ローカルPCにNode.jsやnpmをインストールする必要はありません。

### 前提条件

- VS Code と Dev Containers 拡張機能
- Podman または Docker

### 手順

1. **Podmanボリュームの作成**
アプリケーションのデータを永続化するため、まず名前付きボリュームを作成します。
```bash
podman volume create imagedepot-data
