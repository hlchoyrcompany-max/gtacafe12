(() => {
  const core = window.BlogCore;
  const requested = new URLSearchParams(location.search).get('board');
  const hasBoard = core.boards.includes(requested);
  const board = hasBoard ? requested : '전체글';
  for (const tab of document.querySelectorAll('.mobile-home-nav [data-board]')) {
    if (tab.dataset.board === board) tab.setAttribute('aria-current', 'page');
  }
  const allPosts = window.BLOG_DATA.posts;
  const posts = hasBoard ? allPosts : allPosts.filter(post => post.hideFromHome !== true);
  const rows = document.getElementById('home-rows');
  const input = document.getElementById('home-query');
  const more = document.getElementById('home-more');
  let query = '';
  let limit = 10;

  document.getElementById('board-title').textContent = board === '전체글' ? '전체글보기' : board;
  document.getElementById('board-link').href = 'board.html?board=' + encodeURIComponent(board);

  function render() {
    const results = core.filterPosts(posts, board, query);
    rows.replaceChildren();
    for (const post of results.slice(0, limit)) {
      const row = rows.insertRow();
      const link = document.createElement('a');
      link.href = core.postHref(post.id, location.search);
      link.textContent = post.title;
      row.insertCell().append(link);
      row.insertCell().textContent = post.author || '';
      row.insertCell().textContent = post.date || '';
    }
    if (!results.length) {
      const cell = rows.insertRow().insertCell();
      cell.colSpan = 3;
      cell.className = 'home-empty';
      cell.textContent = query ? '검색 결과가 없습니다.' : '표시할 게시글이 없습니다.';
    }
    more.hidden = results.length <= limit;
  }

  document.getElementById('home-search').addEventListener('submit', event => {
    event.preventDefault();
    query = input.value.trim();
    limit = 10;
    render();
  });
  more.addEventListener('click', () => {
    limit += 10;
    render();
  });
  render();
})();
