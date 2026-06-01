/**
 * 轻量级网络搜索服务
 * 使用搜狗搜索（国内稳定可用，无需 API Key）
 */

const TIMEOUT_MS = 8000;

class WebSearchService {
  /**
   * 执行网络搜索
   * @param {string} query - 搜索关键词
   * @param {number} maxResults - 最大结果数
   * @returns {Promise<{results: Array<{title: string, snippet: string, url: string}>}>}
   */
  async search(query, maxResults = 5) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // 中文查询去掉空格（搜狗对空格敏感，空格会导致返回不相关结果）
      const cleanQuery = query.replace(/\s+/g, '');
      const url = 'https://www.sogou.com/web?query=' + encodeURIComponent(cleanQuery);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`[WebSearch] HTTP ${response.status}`);
        return { results: [], error: `HTTP ${response.status}` };
      }

      const html = await response.text();
      const results = this._parseResults(html, maxResults);
      console.log(`[WebSearch] 搜索 "${query}" 返回 ${results.length} 条结果`);
      return { results };

    } catch (e) {
      if (e.name === 'AbortError') {
        console.log('[WebSearch] 搜索超时');
        return { results: [], error: 'timeout' };
      }
      console.log(`[WebSearch] 搜索失败: ${e.message}`);
      return { results: [], error: e.message };
    }
  }

  /**
   * 解析搜狗 HTML 搜索结果
   * 结构: <h3>标题<a href="链接">...</a></h3> 后跟摘要 <p>
   */
  _parseResults(html, maxResults) {
    const results = [];
    const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    let m;

    while ((m = h3Regex.exec(html)) !== null && results.length < maxResults) {
      const h3Content = m[1];
      const title = this._cleanHTML(h3Content);
      const linkMatch = h3Content.match(/href="([^"]+)"/);

      // 跳过太短的标题（推荐搜索等）
      if (title.length < 8) continue;

      // 在 h3 后面找摘要（尝试多种 HTML 模式）
      const after = html.slice(m.index + m[0].length, m.index + m[0].length + 3000);
      const snippetMatch = after.match(/<p[^>]*class="[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
        || after.match(/<div[^>]*class="[^"]*(?:text|snippet|abstract|desc)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
        || after.match(/<span[^>]*class="[^"]*(?:text|snippet|abstract|desc)[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
        || after.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

      results.push({
        title: title,
        url: linkMatch ? linkMatch[1] : '',
        snippet: snippetMatch ? this._cleanHTML(snippetMatch[1]) : '',
      });
    }

    return results;
  }

  /**
   * 清理 HTML 标签和实体
   */
  _cleanHTML(str) {
    return str
      .replace(/<[^>]*>/g, '')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, ' ')
      .replace(/&ensp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 将搜索结果格式化为文本，供 AI 模型参考
   */
  formatResultsForPrompt(searchResults) {
    if (!searchResults.results || searchResults.results.length === 0) {
      return '未找到相关搜索结果。';
    }

    let text = '## 网络搜索结果（请基于以下最新信息回复，不要使用过时的知识）\n';
    searchResults.results.forEach((r, i) => {
      text += `\n${i + 1}. 【${r.title}】\n${r.snippet}\n`;
    });
    return text;
  }
}

module.exports = WebSearchService;
