/**
 * GitHub Gist 服务
 * 用于与 GitHub Gist API 交互，实现数据云同步
 */

export interface GistConfig {
  token: string;
  gistId?: string;
  filename?: string;
}

export interface GistResponse {
  id: string;
  description: string;
  public: boolean;
  files: {
    [filename: string]: {
      content: string;
      filename: string;
      language?: string;
    };
  };
  updated_at: string;
  created_at: string;
}

export interface GistError {
  message: string;
  documentation_url?: string;
}

const GITHUB_API_BASE = 'https://api.github.com';
const DEFAULT_FILENAME = 'commands.json';

/**
 * GitHub Gist 服务类
 */
export class GistService {
  /**
   * 创建新的 Gist
   * @param data 要保存的数据（JSON 字符串）
   * @param config Gist 配置
   * @returns Gist ID
   */
  static async createGist(data: string, config: GistConfig): Promise<string> {
    const filename = config.filename || DEFAULT_FILENAME;
    const url = `${GITHUB_API_BASE}/gists`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'SniptNote Commands Backup',
        public: false,
        files: {
          [filename]: {
            content: data,
          },
        },
      }),
    });

    if (!response.ok) {
      const error: GistError = await response.json();
      throw new Error(`Failed to create Gist: ${error.message || response.statusText}`);
    }

    const gist: GistResponse = await response.json();
    return gist.id;
  }

  /**
   * 更新现有 Gist
   * @param gistId Gist ID
   * @param data 要保存的数据（JSON 字符串）
   * @param config Gist 配置
   */
  static async updateGist(gistId: string, data: string, config: GistConfig): Promise<void> {
    const filename = config.filename || DEFAULT_FILENAME;
    const url = `${GITHUB_API_BASE}/gists/${gistId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'SniptNote Commands Backup',
        files: {
          [filename]: {
            content: data,
          },
        },
      }),
    });

    if (!response.ok) {
      const error: GistError = await response.json();
      throw new Error(`Failed to update Gist: ${error.message || response.statusText}`);
    }
  }

  /**
   * 获取 Gist 内容
   * @param gistId Gist ID
   * @param config Gist 配置
   * @returns Gist 文件内容
   */
  static async getGist(gistId: string, config: GistConfig): Promise<string> {
    const filename = config.filename || DEFAULT_FILENAME;
    const url = `${GITHUB_API_BASE}/gists/${gistId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const error: GistError = await response.json();
      throw new Error(`Failed to get Gist: ${error.message || response.statusText}`);
    }

    const gist: GistResponse = await response.json();
    const file = gist.files[filename];

    if (!file) {
      throw new Error(`File ${filename} not found in Gist`);
    }

    return file.content;
  }

  /**
   * 检查 Gist 是否存在且可访问
   * @param gistId Gist ID
   * @param config Gist 配置
   * @returns 是否存在
   */
  static async checkGist(gistId: string, config: GistConfig): Promise<boolean> {
    try {
      const url = `${GITHUB_API_BASE}/gists/${gistId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `token ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 验证 GitHub Token 是否有效并获取用户信息
   * @param token GitHub Personal Access Token
   * @returns 用户信息或 null
   */
  static async getUserInfo(token: string): Promise<{ login: string } | null> {
    try {
      const response = await fetch(`${GITHUB_API_BASE}/user`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 验证 GitHub Token 是否有效
   * @param token GitHub Personal Access Token
   * @returns 是否有效
   */
  static async validateToken(token: string): Promise<boolean> {
    const userInfo = await this.getUserInfo(token);
    return userInfo !== null;
  }

  /**
   * 获取 Gist 的更新时间
   * @param gistId Gist ID
   * @param config Gist 配置
   * @returns 更新时间（ISO 字符串）
   */
  static async getGistUpdatedAt(gistId: string, config: GistConfig): Promise<string> {
    const url = `${GITHUB_API_BASE}/gists/${gistId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Gist info');
    }

    const gist: GistResponse = await response.json();
    return gist.updated_at;
  }
}

