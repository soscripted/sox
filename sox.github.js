(function(sox, $) {
  'use strict';

  sox.github = {
    init: function(version, handler) {
      // auto-inject version number and environment information into GitHub issues
      function inject() {
        if (!sox.location.on('github.com/soscripted/sox') || sox.location.on('feature_request')) return;
        const issue = document.querySelector('#issue_body');
        if (!issue) return;
        const environmentText = `**Environment**
SOX version: ${version}
Platform: ${handler}`;

        let issueText = issue.value;
        issueText = issueText.replace(/..Environment..\n.*?Tampermonkey\)/, environmentText); // inject environment details
        issueText += '\n---\n\n### Features Enabled \n\n    ' + JSON.stringify(sox.settings.load());
        issue.value = issueText;
      }

      $(document).on('pjax:complete', inject);
      inject();
    },
  };
})(window.sox = window.sox || {}, jQuery);
