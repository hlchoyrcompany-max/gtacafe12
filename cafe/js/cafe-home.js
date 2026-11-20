(() => {
  const core = window.BlogCore;
  const posts = window.CAFE_EXAMPLE_POSTS;
  const params = new URLSearchParams(location.search);
  const requested = params.get('board');
  const noticeBoards = ['공지사항', '카페 규칙(필독)'];
  const boards = new Set(['전체글', '인기글', '공지', ...posts.map(post => post.category)]);
  const board = boards.has(requested) ? requested : '전체글';
  const isNotice = post => noticeBoards.includes(post.category);
  const rows = document.getElementById('home-rows');
  const input = document.getElementById('home-query');
  const pagination = document.getElementById('home-pagination');
  const pageSize = 10;
  let page = Number(params.get('page')) || 1;
  let query = params.get('q') || '';
  const integer = new Intl.NumberFormat('ko-KR');
  const boardTitle = {전체글: '전체글보기', 인기글: '인기글', 공지: '공지사항'};
  document.getElementById('board-title').textContent = boardTitle[board] || board;
  input.value = query;

  for (const tab of document.querySelectorAll('[data-board]')) {
    if (tab.dataset.board === board) tab.setAttribute('aria-current', 'page');
  }

  function href(nextPage, example) {
    const next = new URLSearchParams();
    if (boards.has(requested)) next.set('board', board);
    if (nextPage > 1) next.set('page', String(nextPage));
    if (query) next.set('q', query);
    if (example) next.set('example', example);
    return '?' + next + (example ? '' : '#latest');
  }

  function addPageLink(number, label) {
    const link = document.createElement('a');
    link.href = href(number);
    link.textContent = label;
    if (number === page && label === String(number)) link.setAttribute('aria-current', 'page');
    pagination.append(link);
  }

  function renderPinned() {
    if (requested || query || page !== 1) return;
    const pinned = document.getElementById('home-mobile-pinned');
    for (const post of core.filterPosts(posts, '전체글').filter(isNotice).slice(0, 2)) {
      const link = document.createElement('a');
      const badge = document.createElement('span');
      badge.textContent = '필독';
      link.href = href(1, post.id);
      link.append(badge, post.title);
      pinned.append(link);
    }
    pinned.hidden = false;
  }

  function render() {
    const results = board === '공지'
      ? core.filterPosts(posts, '전체글', query).filter(isNotice)
      : core.filterPosts(posts, board, query);
    if (board === '전체글' && !query) results.sort((a, b) => Number(isNotice(a)) - Number(isNotice(b)));
    const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
    page = Math.min(totalPages, Math.max(1, Math.floor(page)));
    rows.replaceChildren();
    for (const post of results.slice((page - 1) * pageSize, page * pageSize)) {
      const row = rows.insertRow();
      const link = document.createElement('a');
      link.href = href(page, post.id);
      link.textContent = post.title;
      const titleCell = row.insertCell();
      titleCell.append(link);
      const commentCount = post.likes % 6;
      if (!isNotice(post) && commentCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'home-mobile-comments';
        const count = document.createElement('strong');
        count.textContent = commentCount;
        badge.append(count, '댓글');
        titleCell.append(badge);
      }
      for (const value of [post.author, post.date.replaceAll('-', '.') + '.', integer.format(post.views), integer.format(post.likes)]) {
        row.insertCell().textContent = value;
      }
    }
    if (!results.length) {
      const cell = rows.insertRow().insertCell();
      cell.colSpan = 5;
      cell.className = 'home-empty';
      cell.textContent = '검색 결과가 없습니다.';
    }
    pagination.replaceChildren();
    pagination.hidden = totalPages === 1;
    if (page > 1) addPageLink(page - 1, '이전');
    const first = 1 + Math.floor((page - 1) / 10) * 10;
    for (let number = first; number <= Math.min(first + 9, totalPages); number++) addPageLink(number, String(number));
    if (page < totalPages) addPageLink(page + 1, '다음');
    if (first + 9 < totalPages) addPageLink(first + 10, '다음 10페이지');
  }

  const sample = core.getPost(posts, params.get('example'));
  if (sample) {
    document.body.classList.add('cafe-home-detail');
    document.getElementById('latest').hidden = true;
    document.getElementById('home-example').hidden = false;
    const headline = sample.title.slice(sample.category.length + 3);
    document.title = headline + ' · 위식도역류질환 온라인 커뮤니티';
    const category = document.getElementById('example-category');
    category.textContent = sample.category + ' 〉';
    category.href = '?' + new URLSearchParams({board: sample.category}) + '#latest';
    document.getElementById('example-title').textContent = headline;
    document.getElementById('example-author').textContent = sample.author;
    document.getElementById('example-meta').textContent =
      `${sample.date.replaceAll('-', '.')}. 조회 ${integer.format(sample.views)}`;
    document.getElementById('example-likes').textContent = integer.format(sample.likes);
    document.getElementById('example-comments').textContent = isNotice(sample) ? '0' : sample.likes % 6;
    const back = href(page);
    document.getElementById('example-back').href = back;
    document.getElementById('example-footer-back').href = back;
    document.querySelector('.home-detail-return').href = back;
    return;
  }

  document.getElementById('home-search').addEventListener('submit', event => {
    event.preventDefault();
    query = input.value.trim();
    location.href = href(1);
  });
  renderPinned();
  render();
})();
