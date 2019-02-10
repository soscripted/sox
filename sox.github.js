(function(sox, $) {
  'use strict';

  sox.github = {
    init: function(version, handler) {
      // auto-inject version number and environment information into GitHub issues
      function inject() {
        if (!sox.location.on('github.com/soscripted/sox') || location.href.includes('feature_request')) return;
        const $issue = $('#issue_body');
        if ($issue.length) {
          $issue.prop('disabled', 'true');
          const environmentText = `
**Environment**
SOX version: ${version}
Platform: ${handler}
`;

          let issueText = $issue.text();
          issueText = issueText.replace('**Environment**', environmentText); //inject environment details
          issueText += '\n---\n\n### Features Enabled \n\n    ' + JSON.stringify(sox.settings.load());
          $('#issue_body').delay(500).text(issueText).removeAttr('disabled');
        }
      }

      $(document).on('pjax:complete', inject);
      inject();
    },
  };
})(window.sox = window.sox || {}, jQuery);
