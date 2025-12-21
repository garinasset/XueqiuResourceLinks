// ==UserScript==
// @name         XueqiuResourceLinks
// @name:zh-CN   雪球 · 第三方资源扩展
// @namespace    https://github.com/garinasset/XueqiuResourceLinks
// @version      2.5.3
// @description  在雪球股票详情页侧边栏批量添加第三方扩展链接，支持上交所、深交所、SEC:EDGAR、港交所披露易及老虎证券
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

    function fetchWithCache(key, fetcher) {
        return new Promise(resolve => {
            const cached = sessionStorage.getItem(key);
            if (cached) return resolve(cached);
            fetcher().then(result => {
                if (result != null) sessionStorage.setItem(key, result);
                resolve(result);
            }).catch(() => resolve(null));
        });
    }

    function parseStockInfo() {
        const el = document.querySelector('h1.stock-name');
        if (!el) return null;
        const match = el.textContent.match(/\((SH|SZ|NASDAQ|NYSE|HK):([\w\d]+)\)/i);
        if (!match) return null;
        return { exchange: match[1].toUpperCase(), code: match[2].toUpperCase() };
    }

    const stock = parseStockInfo();
    if (!stock) return;

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
                        resolve(orgId);
                    } catch {
                        resolve(null);
                    }
                },
                onerror: () => resolve(null)
            });
        }));
    }

    const SEC_JSON_URL = 'https://www.sec.gov/files/company_tickers.json';
    function fetchUsCik(ticker) {
        return fetchWithCache('us_cik_' + ticker, () => new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: SEC_JSON_URL,
                onload: res => {
                    try {
                        const data = JSON.parse(res.responseText);
                        const entry = Object.values(data).find(item => item.ticker.toUpperCase() === ticker.toUpperCase());
                        const cik = entry?.cik_str != null ? String(entry.cik_str).padStart(10, '0') : null;
                        resolve(cik);
                    } catch {
                        resolve(null);
                    }
                },
                onerror: () => resolve(null)
            });
        }));
    }

    function fetchHkStockId(code) {
        return fetchWithCache('hk_stockid_' + code, () => new Promise(resolve => {
            const url = `https://www1.hkexnews.hk/search/prefix.do?&callback=callback&lang=ZH&type=A&name=${encodeURIComponent(code)}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: res => {
                    try {
                        const text = res.responseText.trim();
                        const jsonText = text.replace(/^callback\(/, '').replace(/\);$/, '');
                        const json = JSON.parse(jsonText);
                        const stockId = json?.stockInfo?.[0]?.stockId || null;
                        resolve(stockId);
                    } catch {
                        resolve(null);
                    }
                },
                onerror: () => resolve(null)
            });
        }));
    }

    const EXCHANGE_MAP = {
        'SH': { fetcher: fetchSseUid, buildLink: uid => uid && { text: '上证 e 互动', url: `https://sns.sseinfo.com/company.do?uid=${uid}`, favicon: 'https://sns.sseinfo.com/favicon.ico' } },
        'SZ': { fetcher: fetchSzOrgId, buildLink: orgId => orgId && { text: '深交所互动易', url: `https://irm.cninfo.com.cn/ircs/company/companyDetail?stockcode=${stock.code}&orgId=${orgId}`, favicon: 'https://irm.cninfo.com.cn/favicon.ico' } },
        'NASDAQ': { fetcher: fetchUsCik, buildLink: cik => cik && { text: 'SEC：EDGAR', url: `https://www.sec.gov/edgar/browse/?CIK=${cik}`, favicon: 'https://www.sec.gov/favicon.ico' } },
        'NYSE': { fetcher: fetchUsCik, buildLink: cik => cik && { text: 'SEC：EDGAR', url: `https://www.sec.gov/edgar/browse/?CIK=${cik}`, favicon: 'https://www.sec.gov/favicon.ico' } },
        'HK': { fetcher: fetchHkStockId, buildLink: stockId => stockId && { text: '披露易', url: `https://www1.hkexnews.hk/search/titlesearch.xhtml?lang=zh&stockId=${stockId}&category=0&market=SEHK`, favicon: 'https://www.hkexnews.hk/ncms/images/favicon.ico' } }
    };

    const config = EXCHANGE_MAP[stock.exchange];
    if (!config) return;

    const thirdPartyResources = [
        { exchange: stock.exchange, urlFetcher: () => config.fetcher(stock.code).then(config.buildLink) }
    ];

    if (['NASDAQ', 'NYSE', 'HK'].includes(stock.exchange)) {
        thirdPartyResources.push({
            exchange: stock.exchange,
            urlFetcher: async () => ({ text: '老虎证券', url: `https://www.laohu8.com/stock/${stock.code}`, favicon: 'https://www.laohu8.com/favicon.ico' })
        });
    }

    const side = document.querySelector('.container-side-sm');
    if (!side) return;

    let widget = side.querySelector('.stock-widget[data-thirdparty]');
    if (!widget) {
        widget = document.createElement('div');
        widget.className = 'stock-widget';
        widget.setAttribute('data-thirdparty', 'true');
        widget.innerHTML = `<div class="widget-header"><div class="title">第三方资源扩展</div></div><div class="widget-content third-party-links"></div>`;
        const firstWidget = side.querySelector('.stock-widget');
        side.insertBefore(widget, firstWidget?.nextSibling || side.firstChild);
    }
    const container = widget.querySelector('.third-party-links');

    if (!document.getElementById('third-party-links-style')) {
        const style = document.createElement('style');
        style.id = 'third-party-links-style';
        style.textContent = `
            .third-party-links { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
            .third-party-links__item { display: inline-flex; align-items: center; }
            .third-party-links__item a { display: inline-flex; align-items: center; text-decoration: none; color: #333; padding: 4px 0; }
            .third-party-links__item a:hover { text-decoration: underline; }
            .third-party-links__icon { width: 16px; height: 16px; margin-right: 4px; }
            .third-party-links__separator { display: inline-flex; align-items: center; margin: 0 4px; color: #888; }
        `;
        document.head.appendChild(style);
    }

    Promise.all(thirdPartyResources.map(r => r.urlFetcher())).then(results => {
        const filtered = results.filter(r => r);
        filtered.forEach((data, i) => {
            const span = document.createElement('span');
            span.className = 'third-party-links__item';
            span.innerHTML = `<a href="${data.url}" target="_blank">
                <img class="third-party-links__icon" src="${data.favicon}" alt="">
                <span class="third-party-links__text">${data.text}</span>
            </a>`;
            container.appendChild(span);

            if (i < filtered.length - 1) {
                const sep = document.createElement('span');
                sep.className = 'third-party-links__separator';
                sep.textContent = '·'; // 可替换为 / 或 |
                container.appendChild(sep);
            }
        });
    });

})();
