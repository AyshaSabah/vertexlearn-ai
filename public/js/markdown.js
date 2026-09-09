/**
 * VertexLearn AI - Lightweight Client-Side Markdown Renderer & Code Snippet Handler
 * Converts headings, code blocks, lists, blockquotes, inline formatting, and adds copy buttons
 */

function renderMarkdown(md) {
  if (!md) return '';

  // Extract and isolate code blocks
  const codeBlocks = [];
  let html = md.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_SLOT_${codeBlocks.length}__`;
    codeBlocks.push({ lang: (lang || 'code').trim(), code });
    return placeholder;
  });

  // Escape HTML characters in remaining content
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Lists: Unordered (- or *)
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  // Paragraph splitting by empty lines
  const paragraphs = html.split(/\n{2,}/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (/^(<h2|<h3|<h4|<ul|<blockquote|__CODE_BLOCK_SLOT_)/.test(p)) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  // Restore code blocks with syntax styled frame and copy button
  codeBlocks.forEach((cb, idx) => {
    const escapedCode = cb.code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();

    const blockHtml = `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span>${(cb.lang || 'CODE').toUpperCase()}</span>
          <button type="button" class="copy-code-btn" onclick="copyCodeSnippet(this)">
            <span>📋</span> Copy Code
          </button>
        </div>
        <pre class="code-block"><code class="language-${cb.lang}">${escapedCode}</code></pre>
      </div>
    `;
    html = html.replace(`__CODE_BLOCK_SLOT_${idx}__`, blockHtml);
  });

  return html;
}

/**
 * Copy code snippet to clipboard with visual confirmation feedback
 */
function copyCodeSnippet(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  if (!wrapper) return;
  const codeEl = wrapper.querySelector('pre code');
  if (!codeEl) return;
  const text = codeEl.innerText || codeEl.textContent;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopiedState(btn);
    }).catch(() => {
      fallbackCopyText(text, btn);
    });
  } else {
    fallbackCopyText(text, btn);
  }
}

function showCopiedState(btn) {
  const original = btn.innerHTML;
  btn.innerHTML = '<span>✅</span> Copied!';
  btn.style.backgroundColor = 'rgba(16, 185, 129, 0.35)';
  btn.style.borderColor = 'rgba(16, 185, 129, 0.6)';
  setTimeout(() => {
    btn.innerHTML = original;
    btn.style.backgroundColor = '';
    btn.style.borderColor = '';
  }, 2000);
}

function fallbackCopyText(text, btn) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showCopiedState(btn);
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  document.body.removeChild(textArea);
}
