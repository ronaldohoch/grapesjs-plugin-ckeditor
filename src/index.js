import grapesjs from 'grapesjs'

const stopPropagation = e => e.stopPropagation();

grapesjs.plugins.add('gjs-plugin-ckeditor', (editor, opts = {}) => {
  let c = opts;

  let defaults = {
    // CKEditor options
    options: {
      // fix bug : https://github.com/artf/grapesjs-plugin-ckeditor/issues/49
      enterMode: CKEDITOR.ENTER_BR,
      shiftEnterMode: CKEDITOR.ENTER_P
    },

    // On which side of the element to position the toolbar
    // Available options: 'left|center|right'
    position: 'center',
  };

  // Load defaults
  for (let name in defaults) {
    if (!(name in c))
      c[name] = defaults[name];
  }

  if (!CKEDITOR) {
    throw new Error('CKEDITOR instance not found');
  }

  editor.setCustomRte({
    enable(el, rte) {

      // if(rte && rte.status != 'destroyed') {
      //   this.focus(el, rte);
      //   return rte;
      // }
      
      el.contentEditable = true;

      // Seems like 'sharedspace' plugin doesn't work exactly as expected
      // so will help hiding other toolbars already created
      let rteToolbar = editor.RichTextEditor.getToolbarEl();
      [].forEach.call(rteToolbar.children, (child) => {
        child.style.display = 'none';
      });

      // Check for the mandatory options
      var opt = c.options;
      var plgName = 'sharedspace';

      if (opt.extraPlugins) {
        if (typeof opt.extraPlugins === 'string')
          opt.extraPlugins += ',' + plgName;
        else
          opt.extraPlugins.push(plgName);
      } else {
        opt.extraPlugins = plgName;
      }

      if(!c.options.sharedSpaces) {
        c.options.sharedSpaces = {top: rteToolbar};
      }

      // Init CkEditors
      rte = CKEDITOR.inline(el, c.options);

      /**
       * Implement the `rte.getContent` method so that GrapesJS is able to retrieve CKE's generated content (`rte.getData`) properly
       *
       * See:
       *  - {@link https://github.com/artf/grapesjs/issues/2916}
       *  - {@link https://github.com/artf/grapesjs/blob/dev/src/dom_components/view/ComponentTextView.js#L80}
       *  - {@link https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_editor.html#method-getData}
       */
      rte.getContent = rte.getData;

      // Make click event propogate
      rte.on('contentDom', () => {
        var editable = rte.editable();
        editable.attachListener(editable, 'click', () => {
          el.click();
        });
      });

      // The toolbar is not immediatly loaded so will be wrong positioned.
      // With this trick we trigger an event which updates the toolbar position
      rte.on('instanceReady', e => {
        var toolbar = rteToolbar.querySelector('#cke_' + rte.name);
        if (toolbar) {
          toolbar.style.display = 'block';
        }
        editor.trigger('canvasScroll')
      });

      // Prevent blur when some of CKEditor's element is clicked
      rte.on('dialogShow', e => {
        const editorEls = grapesjs.$('.cke_dialog_background_cover, .cke_dialog');
        ['off', 'on'].forEach(m => editorEls[m]('mousedown', stopPropagation));
      });

      this.focus(el, rte);
      return rte;
    },

    disable(el, rte) {
      el.contentEditable = false;
      if(rte && rte.focusManager){
        rte.focusManager.blur(true);
      }
      // fix bug : https://github.com/artf/grapesjs-mjml/issues/193
      // fix bug : https://github.com/artf/grapesjs-plugin-ckeditor/issues/37
      rte.destroy(true); 
    },

    // fix bug : https://github.com/artf/grapesjs-plugin-ckeditor/issues/31
    focus(el, rte) {
      el.contentEditable = true;
      editor.RichTextEditor.updatePosition()
      setTimeout(function() {
        rte && rte.focus();
      }, 200);
    },
  });

});
