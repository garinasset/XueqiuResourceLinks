// ==UserScript==
// @name         XueqiuResourceLinks
// @name:zh-CN   雪球 · 第三方资源扩展
// @namespace    https://github.com/garinasset/XueqiuResourceLinks
// @version      2.5.0
// @description  在雪球股票详情页侧边栏批量添加第三方扩展链接，支持[上交e互动、深交所互动易、SEC:EDGAR、港交所披露易,]，未来可扩展资源数组
// @author       garinasset
// @homepageURL  https://github.com/garinasset/XueqiuResourceLinks
// @supportURL   https://github.com/garinasset/XueqiuResourceLinks/issues
// @updateURL    https://raw.githubusercontent.com/garinasset/XueqiuResourceLinks/main/XueqiuResourceLinks.user.js
// @downloadURL  https://raw.githubusercontent.com/garinasset/XueqiuResourceLinks/main/XueqiuResourceLinks.user.js
// @match        https://xueqiu.com/S/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    /* ========= 通用缓存封装 ========= */
    function fetchWithCache(key, fetcher) {
        return new Promise(resolve => {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                console.debug(`[Cache] ${key} = ${cached}`);
                resolve(cached);
                return;
            }
            fetcher()
                .then(result => {
                    if (result != null) sessionStorage.setItem(key, result);
                    resolve(result);
                })
                .catch(() => resolve(null));
        });
    }

    /* ========= 股票解析 ========= */
    function parseStockInfo() {
        const el = document.querySelector('h1.stock-name');
        if (!el) return null;
        const match = el.textContent.match(/\((SH|SZ|NASDAQ|NYSE|HK):([\w\d]+)\)/i);
        if (!match) return null;
        return { exchange: match[1].toUpperCase(), code: match[2].toUpperCase() };
    }
    const stock = parseStockInfo();
    if (!stock) return;
    console.log(`[Stock] Exchange: ${stock.exchange}, Code: ${stock.code}`);

    /* ========= 上证 UID 查询 ========= */
    function fetchSseUid(stockCode) {
        return fetchWithCache('sse_uid_' + stockCode, () => new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://sns.sseinfo.com/ajax/getCompany.do',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: 'data=' + stockCode,
                onload: res => resolve(res.responseText.trim()),
                onerror: () => resolve(null)
            });
        }));
    }

    /* ========= 深交所 orgId 查询 ========= */
    function fetchSzOrgId(stockCode) {
        return fetchWithCache('sz_orgid_' + stockCode, () => new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://irm.cninfo.com.cn/newircs/index/queryKeyboardInfo',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: 'keyWord=' + stockCode,
                onload: res => {
                    try {
                        const json = JSON.parse(res.responseText);
                        const orgId = json?.data?.[0]?.secid || null;
                        console.debug(`[SZ] Response:`, json, `OrgID: ${orgId}`);
                        resolve(orgId);
                    } catch (e) {
                        console.error('解析深交所 orgId 失败', e);
                        resolve(null);
                    }
                },
                onerror: () => resolve(null)
            });
        }));
    }

    /* ========= 美股 CIK 查询 ========= */
    const SEC_JSON_URL = 'https://www.sec.gov/files/company_tickers.json';
    function fetchUsCik(ticker) {
        return fetchWithCache('us_cik_' + ticker, () => new Promise(resolve => {
            console.debug(`[US] Fetching SEC JSON for ${ticker}`);
            GM_xmlhttpRequest({
                method: 'GET',
                url: SEC_JSON_URL,
                onload: res => {
                    try {
                        const data = JSON.parse(res.responseText);
                        const mapping = Object.values(data);
                        const entry = mapping.find(item => item.ticker.toUpperCase() === ticker.toUpperCase());
                        const cik = entry?.cik_str != null ? String(entry.cik_str).padStart(10, '0') : null;
                        console.debug(`[US] ${ticker} => CIK: ${cik}`);
                        resolve(cik);
                    } catch (e) {
                        console.error('解析 SEC JSON 失败', e);
                        resolve(null);
                    }
                },
                onerror: () => resolve(null)
            });
        }));
    }

    /* ========= 港股 stockId 查询 ========= */
    function fetchHkStockId(code) {
        return fetchWithCache('hk_stockid_' + code, () => new Promise(resolve => {
            const url = `https://www1.hkexnews.hk/search/prefix.do?&callback=callback&lang=ZH&type=A&name=${encodeURIComponent(code)}`;
            console.debug(`[HK] Fetching stockId for ${code} from:`, url);
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: res => {
                    try {
                        const text = res.responseText.trim();
                        const jsonText = text.replace(/^callback\(/, '').replace(/\);$/, '');
                        const json = JSON.parse(jsonText);
                        const stockId = json?.stockInfo?.[0]?.stockId || null;
                        console.debug(`[HK] ${code} => stockId: ${stockId}`);
                        resolve(stockId);
                    } catch (e) {
                        console.error('解析港股 stockId 失败', e, '响应内容:', res.responseText);
                        resolve(null);
                    }
                },
                onerror: () => resolve(null)
            });
        }));
    }

    /* ========= 交易所配置 ========= */
    const EXCHANGE_MAP = {
        'SH': {
            fetcher: fetchSseUid,
            buildLink: uid => uid && { text: '上证 e 互动', url: `https://sns.sseinfo.com/company.do?uid=${uid}`, favicon: 'https://sns.sseinfo.com/favicon.ico' }
        },
        'SZ': {
            fetcher: fetchSzOrgId,
            buildLink: orgId => orgId && { text: '深交所互动易', url: `https://irm.cninfo.com.cn/ircs/company/companyDetail?stockcode=${stock.code}&orgId=${orgId}`, favicon: 'https://irm.cninfo.com.cn/favicon.ico' }
        },
        'NASDAQ': {
            fetcher: fetchUsCik,
            buildLink: cik => cik && { text: 'SEC：EDGAR', url: `https://www.sec.gov/edgar/browse/?CIK=${cik}`, favicon: 'https://www.sec.gov/favicon.ico' }
        },
        'NYSE': {
            fetcher: fetchUsCik,
            buildLink: cik => cik && { text: 'SEC：EDGAR', url: `https://www.sec.gov/edgar/browse/?CIK=${cik}`, favicon: 'https://www.sec.gov/favicon.ico' }
        },
        'HK': {
            fetcher: fetchHkStockId,
            buildLink: stockId => stockId && { text: '披露易', url: `https://www1.hkexnews.hk/search/titlesearch.xhtml?lang=zh&stockId=${stockId}&category=0&market=SEHK`, favicon: 'https://www.hkexnews.hk/ncms/images/favicon.ico' }
        }
    };

    const config = EXCHANGE_MAP[stock.exchange];
    if (!config) return;

    /* ========= 定义第三方资源数组 ========= */
    const thirdPartyResources = [
        {
            exchange: stock.exchange,
            urlFetcher: () => config.fetcher(stock.code).then(config.buildLink)
        }
        // 将来可在此数组追加更多资源
    ];

    /* ========= UI 插入 ========= */
    const side = document.querySelector('.container-side-sm');
    if (!side) return;

    let widget = side.querySelector('.stock-widget[data-thirdparty]');
    if (!widget) {
        widget = document.createElement('div');
        widget.className = 'stock-widget';
        widget.setAttribute('data-thirdparty', 'true');
        widget.innerHTML = `
            <div class="widget-header">
                <div class="title">第三方资源扩展</div>
            </div>
            <div class="widget-content third-party-links"></div>
        `;
        const firstWidget = side.querySelector('.stock-widget');
        side.insertBefore(widget, firstWidget?.nextSibling || side.firstChild);
    }
    const container = widget.querySelector('.third-party-links');

    // 样式
    if (!document.getElementById('third-party-links-style')) {
        const style = document.createElement('style');
        style.id = 'third-party-links-style';
        style.textContent = `
            .third-party-links { display: flex; flex-direction: column; gap: 6px; }
            .third-party-links__item { display: flex; align-items: center; text-decoration: none; color: #333; padding: 4px 0; }
            .third-party-links__item:hover { text-decoration: underline; }
            .third-party-links__icon { width: 16px; height: 16px; margin-right: 6px; }
        `;
        document.head.appendChild(style);
    }

    // 批量插入第三方资源
    thirdPartyResources.forEach(res => {
        if (res.exchange && res.exchange !== stock.exchange) return;
        res.urlFetcher().then(data => {
            if (!data) return;
            const linkEl = document.createElement('a');
            linkEl.className = 'third-party-links__item';
            linkEl.href = data.url;
            linkEl.target = '_blank';
            linkEl.innerHTML = `<img class="third-party-links__icon" src="${data.favicon}" alt=""><span class="third-party-links__text">${data.text}</span>`;
            container.appendChild(linkEl);
        });
    });

})();
