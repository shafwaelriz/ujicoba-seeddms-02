/* Template function which outputs an option in a chzn-select
 * The replace() call is required to prevent xss attacks (see CVE-2019-12745)
 * Using htmlspecialchars() in php isn't sufficient because, chzn_template_func
 * will receive an unescaped string
 * (see https://forums.select2.org/t/propperly-escape-option-value-to-prevent-xss/788)
 */
chzn_template_func = function (state) { /* {{{ */
	var subtitle = '';
	if(state.subtitle)
		subtitle = state.subtitle;
	if($(state.element).data('subtitle'))
		subtitle = $(state.element).data('subtitle')+''; /* make sure it is a string */
	var warning = '';
	if($(state.element).data('warning'))
		warning = $(state.element).data('warning')+''; /* make sure it is a string */
	var html = '<span>';
	if($(state.element).data('before-title'))
		html += $(state.element).data('before-title')+'';
	if($(state.element).data('icon-before'))
		html += '<i class="fa fa-'+$(state.element).data('icon-before')+'"></i> ';
	html += state.text.replace(/</g, '&lt;')+'';
	if(subtitle)
		html += '<br /><i>'+subtitle.replace(/</g, '&lt;')+'</i>';
	if(warning)
		html += '<br /><span class="label label-warning"><i class="fa fa-warning"></i></span> '+warning+'';
	html += '</span>';
	var $newstate = $(html);
	return $newstate;
}; /* }}} */

function chzn_select_item(target, id) { /* {{{ */
	var option = $(target).children('[value=' + id + ']');
	option.detach();
	$(target).append(option).change();
}; /* }}} */

function escapeHtml(text) { /* {{{ */
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
} /* }}} */

/**
 * Format bytes as human-readable text.
 * 
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use 
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 * 
 * @return Formatted string.
 */
function formatFileSize(bytes, si=false, dp=1) { /* {{{ */
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si 
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10**dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
} /* }}} */

function treeFolderSelected(formid, nodeid, nodename) {
	$('#'+formid).val(nodeid);
	$('#choosefoldersearch'+formid).val(nodename);
	$('#folderChooser'+formid).modal('hide');
}

function treeDocumentSelected(formid, nodeid, nodename) {
	$('#'+formid).val(nodeid);
	$('#choosedocsearch'+formid).val(nodename);
	$('#docChooser'+formid).modal('hide');
}

function initMost() { /* {{{ */
	$('.datepicker, #expirationdate, #createstartdate, #createenddate, #expirationstartdate, #expirationenddate')
		.datepicker({todayHighlight: true, toggleActive: true, autoclose: "true", zIndexOffset: "1040"})
	/*
		.on('changeDate', function(ev){
			if(ev.date && $(ev.target).data('selectmenu')) {
				$("#"+$(ev.target).data('selectmenu')).val('date');
			}
			$(ev.currentTarget).datepicker('hide');
		});
*/

	$(".chzn-select").select2({ /* {{{ */
		theme: "bootstrap4",
		width: 'resolve',
		debug: false,
		templateResult: chzn_template_func
	}); /* }}} */

	/* newly selected items will be appended to the end */
	$('.chzn-select[order=keep]').on('select2:select', function (e) { /* {{{ */
    chzn_select_item(e.target, e.params.data.id);
	}); /* }}} */

	$(".chzn-select-folder").select2({ /* {{{ */
		theme: "bootstrap4",
		width: 'resolve',
		ajax: {
			url: seeddms_webroot+"op/op.Ajax.php",
			delay: 500,
			data: function (params) {
				var query = {
					query: params.term,
					command: 'searchfolder',
					format: 'select2'
				}
				// Query parameters will be ?search=[term]&command=folderlist
				return query;
			},
			processResults: function(data) {
				$.map(data.results, function (obj) {obj.text = obj.name || obj.text; obj.subtitle = obj.path || obj.subtitle; return obj; });
				return {
					results: data.results
				};
			},
			dataType: 'json'
		},
		templateResult: chzn_template_func
	}); /* }}} */

	/* change the color and length of the bar graph showing the password
	 * strength on each change to the passwod field.
	 */
	$(".pwd").passStrength({ /* {{{ */
		url: seeddms_webroot+"op/op.Ajax.php",
		onChange: function(data, target) {
			pwsp = 100*data.score;
			$('#'+target+' div.bar').width(pwsp+'%');
			if(data.ok) {
				$('#'+target+' div.bar').removeClass('bg-danger');
				$('#'+target+' div.bar').addClass('bg-success');
			} else {
				$('#'+target+' div.bar').removeClass('bg-success');
				$('#'+target+' div.bar').addClass('bg-danger');
			}
		}
	}); /* }}} */

	/* The typeahead functionality useѕ the modified version of
	 * bootstrap-typeahead, which is able to set the render function.
	 * This was needed because the search function return json objects
	 * for each hit and render could only process strings.
	 * */
	$("#searchfield").typeahead({ /* {{{ */
		menu: '<div class="typeahead dropdown-menu" style="max-height: 600px; overflow-y: auto;"></div>',
		item: '<a class="dropdown-item" href="#"></a>',
		itemtag: 'a',
		minLength: 3,
		items: 100, /* the query will limit the number of hits */
		source: function(query, process) {
			var d = new Date();
			var pastYear = d.getFullYear() - 1;
			d.setFullYear(pastYear);
//			console.log(d.toISOString().split('T')[0]);

			var data = {
				query: query,
				limit: 15,
				action: 'typeahead'
			};
			/* Return a list of json objects, each containing
			 * type: type of object (D=doc, F=folder, S=searchterm)
			 * name: name of object
			 */
			$.get(seeddms_webroot+'out/out.Search.php', data, function(data) {
				process(data);
			});
		},
		/* updater is called when the item in the list is clicked. It is
		 * actually provided to update the input field, but here we use
		 * it to set the document location. The passed value is the string
		 * set in data-value of the list items.
		 * This method relies on some changes in bootstrap-typeahead.js
		 * Originally, update was passed only the data-value of the li item
		 * which is set in the render fuction below,
		 * but the modified version passes all data fields. which also
		 * contain the 'id' and 'type' (also set in render function).
		 **/
		updater: function (item) {
			if(item.id) {
				if(item.type == 'D')
					document.location = seeddms_webroot+"out/out.ViewDocument.php?documentid=" + item.id;
				else
					document.location = seeddms_webroot+"out/out.ViewFolder.php?folderid=" + item.id;
			} else
				document.location = seeddms_webroot+"out/out.Search.php?query=" + encodeURIComponent(item.value);
			return item.value;
		},
		sorter: function(items) {
			return items;
		},
		/* matcher will always return true, because the initial search returns
		 * matches only
  	 */
		matcher : function (item) {
			return true;
		},
		/* highlighter is for modifying the 'a' tag text. It places an icon
		 * in front of the name and replaces a '<' within the name with an
		 * entity.
		 **/
		highlighter : function (item) {
			if(item.type.charAt(0) == 'D')
				return '<i class="fa fa-file"></i> ' + item.name.replace(/</g, '&lt;') + '<br /><span class="path">' + item.path + '</span>';
			else if(item.type.charAt(0) == 'F')
				return '<i class="fa fa-folder-o"></i> ' + item.name.replace(/</g, '&lt;') + '<br /><span class="path">' + item.path + '</span>';
			else
				return '<i class="fa fa-search"></i> ' + item.name.replace(/</g, '&lt;') + (item.occurences > 0 ? ' (' + item.occurences + ')' : '') + (typeof(item.column) != 'undefined' ? '<br /><span class="path">' + item.column + '</span>' : '');
		},
		/* This only works with a modified version of bootstrap typeahead located
		 * in boostrap-typeahead.js Search for 'render'
		 * The line
		 * this.render = this.options.render || this.render
		 * was added to bootstrap-typeahead.js
		 * The following function is a copy of the original render function but
		 * access item.name instead of item
		 */
		render : function (items) {
      var that = this

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item.name).attr('data-id', item.id).attr('data-type', item.type);
        /* i is already the 'a' tag, there is no 'li' as used by bootstrap 2 */
        i./*find('a').*/html(that.highlighter(item))
        return i[0]
      })

      items.first().addClass('active')
      this.$menu.html(items)
      return this
    }

	}); /* }}} */

	/* Document chooser */
	$("[id^=choosedocsearch]").typeahead({ /* {{{ */
		menu: '<div class="typeahead dropdown-menu"></div>',
		item: '<a class="dropdown-item" href="#"></a>',
		itemtag: 'a',
		minLength: 3,
		source: function(query, process) {
//		console.log(this.options);
			$.get(seeddms_webroot+'op/op.Ajax.php', { command: 'searchdocument', query: query, limit: 8 }, function(data) {
					process(data);
			});
		},
		/* updater is called when the item in the list is clicked. It is
		 * provided to update the input field where you type. */
		updater: function (item) {
			target = this.$element.data('target');
			$('#'+target).attr('value', item.id);
			return item.value;
		},
		sorter: function(items) {
			return items;
		},
		/* Set a matcher that allows any returned value */
		matcher : function (item) {
			return true;
		},
		highlighter : function (item) {
			return '<i class="fa fa-file"></i> ' + item.name.replace(/</g, '&lt;') + (typeof(item.path) != 'undefined' ? '<br /><span class="path">' + item.path + '</span>' : '');
		},
		/* This only works with a modified version of bootstrap typeahead located
		 * in boostrap-typeahead.js Search for 'render'
		 * The line
		 * this.render = this.options.render || this.render
		 * was added to bootstrap-typeahead.js
		 * The following function is a copy of the original render function but
		 * access item.name instead of item
		 */
		render : function (items) {
			var that = this

			items = $(items).map(function (i, item) {
				i = $(that.options.item).attr('data-value', item.name).attr('data-id', item.id).attr('data-type', item.type);
				i./*find('a').*/html(that.highlighter(item))
				return i[0]
			})

			items.first().addClass('active')
			this.$menu.html(items)
			return this
		}
	}); /* }}} */

	/* Folder chooser */
	$("[id^=choosefoldersearch]").typeahead({ /* {{{ */
		menu: '<div class="typeahead dropdown-menu"></div>',
		item: '<a class="dropdown-item" href="#"></a>',
		itemtag: 'a',
		minLength: 3,
		source: function(query, process) {
//		console.log(this.options);
			$.get(seeddms_webroot+'op/op.Ajax.php', { command: 'searchfolder', query: query, limit: 8 }, function(data) {
					process(data);
			});
		},
		/* updater is called when the item in the list is clicked. It is
		 * actually provided to update the input field, but here we use
		 * it to set the document location. */
		updater: function (item) {
			target = this.$element.data('target');
			$('#'+target).attr('value', item.id);
			return item.value;
		},
		sorter: function(items) {
			return items;
		},
		/* Set a matcher that allows any returned value */
		matcher : function (item) {
			return true;
		},
		highlighter : function (item) {
			return '<i class="fa fa-folder-o"></i> ' + item.name.replace(/</g, '&lt;') + (typeof(item.path) != 'undefined' ? '<br /><span class="path">' + item.path + '</span>' : '');
		},
		/* This only works with a modified version of bootstrap typeahead located
		 * in boostrap-typeahead.js Search for 'render'
		 * The line
		 * this.render = this.options.render || this.render
		 * was added to bootstrap-typeahead.js
		 * The following function is a copy of the original render function but
		 * access item.name instead of item
		 */
		render : function (items) {
			var that = this

			items = $(items).map(function (i, item) {
				i = $(that.options.item).attr('data-value', item.name).attr('data-id', item.id).attr('data-type', item.type);
				i./*find('a').*/html(that.highlighter(item))
				return i[0]
			})

			items.first().addClass('active')
			this.$menu.html(items)
			return this
		}
	}); /* }}} */
} /* }}} */

$(document).ready( function() {
	$('body').on('click', '.dropdown-menu a.dropdown-toggle', function (e) { /* {{{ */
		if (!$(this).next().hasClass('show')) {
			$(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
		}
		var $subMenu = $(this).next(".dropdown-menu");
		$subMenu.toggleClass('show');


		$(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function(e) {
			$('.dropdown-submenu .show').removeClass("show");
		});


		return false;
	}); /* }}} */

	/* close popovers when clicking somewhere except in the popover or the
	 * remove icon
	 */
	$('html').on('click', function(e) { /* {{{ */
		if (typeof $(e.target).data('original-title') == 'undefined' && !$(e.target).parents().is('.popover.in') && !$(e.target).is('.fa fa-remove')) {
			$('[data-original-title]').popover('hide');
		}
	}); /* }}} */

	$('body').on('hidden', '.modal', function () { /* {{{ */
		$(this).removeData('modal');
	}); /* }}} */

	/* Bootstrap 4 does not support to the remote loading of the modal content
	 * anymore. This adds it by using jquery.
	 */
	$('body').on('click', '[data-toggle="modal"]', function(ev){ /* {{{ */
		ev.preventDefault();
		if($(this).data("remote"))
			$($(this).data("target")+' .modal-body').load($(this).data("remote"));
		/* Also set the title */
		if($(this).data("modal-title"))
			$($(this).data("target")+' .modal-header h3').html($(this).data("modal-title"));
	}); /* }}} */

	$('body').on('click', '.show-hide-password a', function(ev) { /* {{{ */
		ev.preventDefault();
//		console.log($(this).closest('input'));
//		console.log($(ev.target).parent().parent().children('input'));
		if($('.show-hide-password input').attr("type") == "text"){
			$('.show-hide-password input').attr('type', 'password');
			$('.show-hide-password i').addClass( "fa-eye-slash" );
			$('.show-hide-password i').removeClass( "fa-eye" );
		}else if($('.show-hide-password input').attr("type") == "password"){
			$('.show-hide-password input').attr('type', 'text');
			$('.show-hide-password i').removeClass( "fa-eye-slash" );
			$('.show-hide-password i').addClass( "fa-eye" );
		}
	}); /* }}} */

//	$('body').on('touchstart.dropdown', '.dropdown-menu', function (e) { e.stopPropagation(); });

	initMost();

	$('body').on('click', '[id^=clearfolder]', function(ev) { /* {{{ */
		ev.preventDefault();
		ev.stopPropagation();
		target = $(this).data('target');
		$('#choosefoldersearch'+target).val('');
		$('#'+target).val('');
	}); /* }}} */

	$('body').on('click', '[id^=cleardocument]', function(ev) { /* {{{ */
		ev.preventDefault();
		ev.stopPropagation();
		target = $(this).data('target');
		$('#choosedocsearch'+target).val('');
		$('#'+target).val('');
	}); /* }}} */

	$('body').on('click', '#clipboard-float', function(ev) { /* {{{ */
		ev.preventDefault();
		ev.stopPropagation();
		$('#clipboard-container').toggleClass('clipboard-container');
	}); /* }}} */

	$('body').on('click', 'a.addtoclipboard', function(ev) { /* {{{ */
		ev.preventDefault();
		ev.stopPropagation();
		attr_rel = $(ev.currentTarget).attr('rel');
		attr_msg = $(ev.currentTarget).attr('msg');
		type = attr_rel.substring(0, 1) == 'F' ? 'folder' : 'document';
		id = attr_rel.substring(1);
		$.get(seeddms_webroot+'op/op.Ajax.php',
			{ command: 'addtoclipboard', type: type, id: id },
			function(data) {
				if(data.success) {
					$("#main-clipboard").html('Loading').load(seeddms_webroot+'out/out.Clipboard.php?action=mainclipboard')
					$("#menu-clipboard div").html('Loading').load(seeddms_webroot+'out/out.Clipboard.php?action=menuclipboard')
					$("div.ajax[data-action='navigation']").trigger('update', {});
					$("div.ajax[data-action='folderList']").trigger('update', {});
					noty({
						text: attr_msg,
						type: 'success',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 1500
					});
				} else {
					noty({
						text: data.message,
						type: 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 3500
					});
				}
			},
			'json'
		);
	}); /* }}} */

	$('body').on('click', 'a.removefromclipboard', function(ev){ /* {{{ */
		ev.preventDefault();
		attr_rel = $(ev.currentTarget).attr('rel');
		attr_msg = $(ev.currentTarget).attr('msg');
		type = attr_rel.substring(0, 1) == 'F' ? 'folder' : 'document';
		id = attr_rel.substring(1);
		$.get(seeddms_webroot+'op/op.Ajax.php',
			{ command: 'removefromclipboard', type: type, id: id },
			function(data) {
				if(data.success) {
					$("#main-clipboard").html('Loading').load(seeddms_webroot+'out/out.Clipboard.php?action=mainclipboard')
					$("#menu-clipboard div").html('Loading').load(seeddms_webroot+'out/out.Clipboard.php?action=menuclipboard')
					$("div.ajax[data-action='navigation']").trigger('update', {});
					$("div.ajax[data-action='folderList']").trigger('update', {});
					noty({
						text: attr_msg,
						type: 'success',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 1500
					});
				} else {
					noty({
						text: data.message,
						type: 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 3500
					});
				}
			},
			'json'
		);
	}); /* }}} */

	$('body').on('click', 'a.lock-document-btn', function(ev){ /* {{{ */
		ev.preventDefault();
		attr_rel = $(ev.currentTarget).attr('rel');
		attr_msg = $(ev.currentTarget).attr('msg');
		id = attr_rel;
		$.get(seeddms_webroot+'op/op.Ajax.php',
			{ command: 'tooglelockdocument', formtoken: $(ev.currentTarget).data('formtoken'), id: id },
			function(data) {
				if(data.success) {
					//$("#table-row-document-"+id).html('Loading').load('../op/op.Ajax.php?command=view&view=documentlistrow&id='+id)
					$("#table-row-document-"+id).html('Loading').load(seeddms_webroot+'out/out.ViewDocument.php?action=documentlistitem&documentid='+id)
					noty({
						text: attr_msg,
						type: 'success',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 1500
					});
				} else {
					noty({
						text: data.message,
						type: 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 3500
					});
				}
			},
			'json'
		);
	}); /* }}} */

	$('a.movefolder').click(function(ev){ /* {{{ */
		ev.preventDefault();
		attr_source = $(ev.currentTarget).attr('source');
		attr_dest = $(ev.currentTarget).attr('dest');
		attr_msg = $(ev.currentTarget).attr('msg');
		attr_formtoken = $(ev.currentTarget).attr('formtoken');
		$.get(seeddms_webroot+'op/op.Ajax.php',
			{ command: 'movefolder', folderid: attr_source, targetfolderid: attr_dest, formtoken: attr_formtoken },
			function(data) {
				if(data.success) {
					$('#table-row-folder-'+attr_source).hide('slow');
					noty({
						text: data.msg,
						type: data.success ? 'success' : 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 1500
					});
				}
			},
			'json'
		);
	}); /* }}} */

	$('a.movedocument').click(function(ev){ /* {{{ */
		ev.preventDefault();
		attr_source = $(ev.currentTarget).attr('source');
		attr_dest = $(ev.currentTarget).attr('dest');
		attr_msg = $(ev.currentTarget).attr('msg');
		attr_formtoken = $(ev.currentTarget).attr('formtoken');
		$.get(seeddms_webroot+'op/op.Ajax.php',
			{ command: 'movedocument', docid: attr_source, targetfolderid: attr_dest, formtoken: attr_formtoken },
			function(data) {
				if(data.success) {
					$('#table-row-document-'+attr_source).hide('slow');
					noty({
						text: data.msg,
						type: data.success ? 'success' : 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 1500
					});
				}
			},
			'json'
		);
	}); /* }}} */

	$('.send-missing-translation a').click(function(ev){ /* {{{ */
//		console.log($(ev.target).parent().children('[name=missing-lang-key]').val());
//		console.log($(ev.target).parent().children('[name=missing-lang-lang]').val());
//		console.log($(ev.target).parent().children('[name=missing-lang-translation]').val());
		$.ajax(seeddms_webroot+'op/op.Ajax.php', {
			type:"POST",
			async:true,
			dataType:"json",
			data: {
				command: 'submittranslation',
				key: $(ev.target).parent().children('[name=missing-lang-key]').val(),
				lang: $(ev.target).parent().children('[name=missing-lang-lang]').val(),
				phrase: $(ev.target).parent().children('[name=missing-lang-translation]').val()
			},
			success: function(data, textStatus) {
				noty({
					text: data.message,
					type: data.success ? 'success' : 'error',
					dismissQueue: true,
					layout: 'topRight',
					theme: 'defaultTheme',
					timeout: 1500
				});
			}
		});
	}); /* }}} */

	$('div.ajax').each(function(index) { /* {{{ */
		var element = $(this);
		var url = '';
		var href = element.data('href');
		var base = element.data('base');
		if(typeof base == 'undefined')
			base = '';
		var view = element.data('view');
		var action = element.data('action');
		var query = element.data('query');
		var afterload = $(this).data('afterload');
		var waitmsg = element.data('wait-msg');
		if(typeof waitmsg == 'undefined')
			waitmsg = '';
		if(view && action) {
			url = seeddms_webroot+base+"out/out."+view+".php?action="+action;
			if(query) {
				url += "&"+query;
			}
		} else
			url = href;
		if(!element.data('no-spinner'))
			element.prepend('<div style="position: _absolute; overflow: hidden; background: #f7f7f7; z-index: 1000; height: 200px; width: '+element.width()+'px; opacity: 0.7; display: table;"><div style="display: table-cell;text-align: center; vertical-align: middle; "><img src="../views/bootstrap/images/ajax-loader.gif"><div>'+waitmsg+'</div></div>');
		$.get(url, function(data) {
			element.html(data);
			if(afterload) {
				var func = eval(afterload);
				if(typeof func === "function"){
					func();
				}
			}
			initMost();
			SeedDMSAjax.run(view, action);
		});
	}); /* }}} */

	$('div.ajax').on('update', function(event, param1, callback) { /* {{{ */
		var element = $(this);
		var url = '';
		var href = element.data('href');
		var base = element.data('base');
		if(typeof base == 'undefined')
			base = '';
		var view = element.data('view');
		var action = element.data('action');
		var query = element.data('query');
		var afterload = $(this).data('afterload');
		var updatemsg = element.data('update-msg');
		var runinit = true;
		if(view && action) {
			url = seeddms_webroot+base+"out/out."+view+".php?action="+action;
			if(query) {
				url += "&"+query;
			}
		} else
			url = href;
		if(typeof param1 === 'object') {
			for(var key in param1) {
				if(key == 'callback')
					callback = param1[key];
				else if(key == 'noinit')
					runinit = !param1[key];
				else {
					if($.isArray(param1[key])) {
						if(param1[key].length > 0)
							url += "&"+key+"[]="+param1[key].join("&"+key+"[]=");
					} else
						url += "&"+key+"="+param1[key];
				}
			}
		} else {
			url += "&"+param1;
		}
		//console.log(url);
		if(typeof updatemsg != 'undefined')
			element.html(updatemsg);
		if(!element.data('no-spinner'))
			element.prepend('<div style="position: absolute; overflow: hidden; background: #f7f7f7; z-index: 1000; height: '+element.height()+'px; width: '+element.width()+'px; opacity: 0.7; display: table;"><div style="display: table-cell;text-align: center; vertical-align: middle; "><img src="../views/bootstrap/images/ajax-loader.gif"></div>');
		$.get(url, function(data) {
			element.html(data);
			if(callback)
				callback.call();
			if(afterload) {
				var func = eval(afterload);
				if(typeof func === "function"){
					func();
				}
			}
			if(runinit) {
				initMost();
			}
			SeedDMSAjax.run(view, action);
		});
	}); /* }}} */

	$("body").on("click", ".ajax-click", function() { /* {{{ */
		var element = $(this);
		var url = seeddms_webroot+"op/op.Ajax.php"+"?"+element.data('param1');
		var param2 = element.data('param2');
		var param3 = element.data('param3');
		if(typeof param2 !== 'undefined')
			url += "&"+param2;
		if(typeof param3 !== 'undefined')
			url += "&"+param3;
		$.ajax({
			type: 'GET',
			url: url,
			dataType: 'json',
			success: function(data){
				if(data.success) {
					if(element.data('param1') == 'command=clearclipboard') {
						$("#main-clipboard").html('Loading').load(seeddms_webroot+'out/out.Clipboard.php?action=mainclipboard')
						$("#menu-clipboard div").html('Loading').load(seeddms_webroot+'out/out.Clipboard.php?action=menuclipboard')
					}
					noty({
						text: data.message,
						type: 'success',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 1500
					});
				} else {
					noty({
						text: data.message,
						type: 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 3500
					});
				}
			}
		});
	}); /* }}} */

	$('button.history-back').on('click', function(event) { /* {{{ */
		window.history.back();
	}); /* }}} */

	$("body").on("blur", "span.editable", function(e) { /* {{{ */
		console.log($(this).data('document'));
		e.preventDefault();
		$.post(seeddms_webroot+"op/op.Ajax.php", { command: "setdocumentname", id: $(this).data('document'), formtoken: $(this).data('formtoken'), name: $(this).text() })
			.done(function( data ) {
				noty({
					text: data.message,
					type: data.success ? 'success' : 'error',
					dismissQueue: true,
					layout: 'topRight',
					theme: 'defaultTheme',
					timeout: 1500
				});
		});
	}); /* }}} */

	$("body").on("keypress", "span.editable", function(e) { /* {{{ */
		if(e.which == 13) {
			$(this).blur();
		}
		return e.which != 13;
	}); /* }}} */
});

function onAddClipboard(ev) { /* {{{ */
	ev.preventDefault();
	var source_info = JSON.parse(ev.originalEvent.dataTransfer.getData("text"));
	source_type = source_info.type;
	source_id = source_info.id;
	formtoken = source_info.formtoken;
	if(source_type == 'document' || source_type == 'folder') {
		$.get(seeddms_webroot+'op/op.Ajax.php',
			{ command: 'addtoclipboard', type: source_type, id: source_id },
			function(data) {
				if(data.success) {
					$("#main-clipboard").html('Loading').load(seeddms_webroot+'out/out.Clipboard.php?action=mainclipboard')
					$("#menu-clipboard div").html('Loading').load(seeddms_webroot+'out/out.Clipboard.php?action=menuclipboard')
					$("div.ajax[data-action='navigation']").trigger('update', {});
					$("div.ajax[data-action='folderList']").trigger('update', {});
					noty({
						text: data.message,
						type: 'success',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 1500
					});
				} else {
					noty({
						text: data.message,
						type: 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 3500
					});
				}
			},
			'json'
		);
		//url = "../op/op.AddToClipboard.php?id="+source_id+"&type="+source_type;
		//document.location = url;
	}
} /* }}} */

(function( SeedDMSUpload, $, undefined ) { /* {{{ */
	var ajaxurl = seeddms_webroot+"op/op.Ajax.php";
	var editBtnLabel = "Edit";
	var abortBtnLabel = "Abort";
	var maxFileSize = 100000;
	var maxFileSizeMsg = 'File too large';
	var rowCount=0;

	SeedDMSUpload.setUrl = function(url)  {
		ajaxurl = url;
	}

	SeedDMSUpload.setAbortBtnLabel = function(label)  {
		abortBtnLabel = label;
	}

	SeedDMSUpload.setEditBtnLabel = function(label)  {
		editBtnLabel = label;
	}

	SeedDMSUpload.setMaxFileSize = function(size)  {
		maxFileSize = size;
	}

	SeedDMSUpload.getMaxFileSize = function()  {
		return maxFileSize;
	}

	SeedDMSUpload.setMaxFileSizeMsg = function(msg)  {
		maxFileSizeMsg = msg;
	}

	SeedDMSUpload.getMaxFileSizeMsg = function()  {
		return maxFileSizeMsg;
	}

//	function sendFileToServer(formData,status,callback) {
	SeedDMSUpload.sendFileToServer = function(formData,status,callback) {
		var jqXHR=$.ajax({
			xhr: function() {
			var xhrobj = $.ajaxSettings.xhr();
			if (xhrobj.upload) {
				xhrobj.upload.addEventListener('progress', function(event) {
						var percent = 0;
						var position = event.loaded || event.position;
						var total = event.total;
						if (event.lengthComputable) {
								percent = Math.ceil(position / total * 100);
						}
						//Set progress
						status.setProgress(percent);
					}, false);
				}
				return xhrobj;
			},
			url: ajaxurl,
			type: "POST",
			contentType: false,
			dataType:"json",
			processData: false,
			cache: false,
			data: formData,
			success: function(data, textStatus) {
				status.setProgress(100);
				if(data.success) {
					noty({
						text: data.message,
						type: 'success',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 1500
					});
					if(editBtnLabel)
						status.statusbar.after($('<a href="'+seeddms_webroot+'out/out.EditDocument.php?documentid=' + data.data + '" class="btn btn-mini btn-sm btn-primary">' + editBtnLabel + '</a>'));
					if(callback) {
						callback();
					}
				} else {
					noty({
						text: data.message,
						type: 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 3500
					});
				}
			}
		});

		status.setAbort(jqXHR);
	}

	SeedDMSUpload.addSubFolder = function(formData) {
		var ret = false;
		$.ajax({
			url: ajaxurl,
			type: "POST",
			contentType: false,
			dataType:"json",
			processData: false,
			cache: false,
			async: false,
			data: formData,
			success: function(data, textStatus) {
				if(data.success) {
					noty({
						text: data.message,
						type: 'success',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 1500
					});
					ret = data.data;
				} else {
					noty({
						text: data.message,
						type: 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 3500
					});
				}
			}
		});
		return ret;
	}

	//function createStatusbar(obj) {
	SeedDMSUpload.createStatusbar = function(obj)  {
		rowCount++;
		var row="odd";
		this.obj = obj;
		if(rowCount %2 ==0) row ="even";
		this.statusbar = $("<div class='statusbar "+row+"'></div>");
		this.filename = $("<div class='filename'></div>").appendTo(this.statusbar);
		this.size = $("<div class='filesize'></div>").appendTo(this.statusbar);
		this.progressBar = $("<div class='progress'><div class='bar bg-success'></div></div>").appendTo(this.statusbar);
		this.abort = $("<div class='btn btn-mini btn-sm btn-danger'>" + abortBtnLabel + "</div>").appendTo(this.statusbar);
//		$('.statusbar').empty();
		obj.after(this.statusbar);
		this.setFileNameSize = function(name,size) {
			var sizeStr="";
			var sizeKB = size/1024;
			if(parseInt(sizeKB) > 1024) {
				var sizeMB = sizeKB/1024;
				sizeStr = sizeMB.toFixed(2)+" MB";
			} else {
				sizeStr = sizeKB.toFixed(2)+" KB";
			}

			this.filename.html(name);
			this.size.html(sizeStr);
		}
		this.setProgress = function(progress) {
//			var progressBarWidth =progress*this.progressBar.width()/ 100;
			this.progressBar.find('div').animate({ width: progress+"%" }, 10).html(progress + "% ");
			if(parseInt(progress) >= 100) {
				this.abort.hide();
			}
		}
		this.setAbort = function(jqxhr) {
			var sb = this.statusbar;
			this.abort.click(function() {
				jqxhr.abort();
				sb.hide();
			});
		}
	}

	// formData - instance of FormData object
	// data - object to post
	SeedDMSUpload.getFormData = function(formData, data, previousKey) {
		if (data instanceof Object) {
			Object.keys(data).forEach(key => {
				const value = data[key];
				if (value instanceof Object && !Array.isArray(value)) {
					return this.getFormData(formData, value, key);
				}
				if (previousKey) {
					key = `${previousKey}[${key}]`;
				}
				if (Array.isArray(value)) {
					value.forEach(val => {
						formData.append(`${key}[]`, val);
					});
				} else {
					formData.append(key, value);
				}
			});
		} else if(typeof data !== 'undefined') {
			formData.append(previousKey, data);
		}
	}

	SeedDMSUpload.handleFileUpload = function(target_id, target_type, items,obj,statusbar) {
		/* target is set for the quick upload area */
//		var target_id = obj.data('target');
//		var target_type = 'folder';
		/* droptarget is set for folders and documents in lists */
//		var droptarget = obj.data('droptarget');
//		if(droptarget) {
//			target_type = droptarget.split("_")[0];
//			target_id = droptarget.split("_")[1];
//		}
		var afterupload = obj.data('afterupload');
		if(afterupload) {
			afteruploadfunc = eval(afterupload);
		} else {
			afteruploadfunc = function() {
				if(target_id == seeddms_folder)
					$("div.ajax[data-action='folderList']").trigger('update', {folderid: seeddms_folder});
			}
		}
		if(target_type == 'folder' && target_id) {
			for (var i = 0; i < items.length; i++) {
				var item = items[i]; //.webkitGetAsEntry();
				if (item.isFile) {
					item.file(function(file) {
						if(file.size <= maxFileSize) {
							var fd = new FormData();
							fd.append('targettype', target_type);
							fd.append('folderid', target_id);
							fd.append('formtoken', obj.data('uploadformtoken'));
							if (typeof obj.data('comment') !== 'undefined') {
								fd.append('comment', obj.data('comment'));
							}
							if (typeof obj.data('keywords') !== 'undefined') {
								fd.append('keywords', obj.data('keywords'));
							}
							fd.append('userfile', file);
							fd.append('command', 'uploaddocument');
							SeedDMSUpload.getFormData(fd, obj.data('attributes'), 'attributes');
							SeedDMSUpload.getFormData(fd, obj.data('categories'), 'categories');
		//					fd.append('path', file.webkitRelativePath);

							statusbar.parent().show();
							var status = new SeedDMSUpload.createStatusbar(statusbar);
							status.setFileNameSize(file.name,file.size);
							SeedDMSUpload.sendFileToServer(fd,status,afteruploadfunc);
						} else {
							noty({
								text: maxFileSizeMsg + '<br /><em>' + file.name + ' (' + file.size + ' Bytes)</em>',
								type: 'error',
								dismissQueue: true,
								layout: 'topRight',
								theme: 'defaultTheme',
								timeout: 5000
							});
						}
					});
				} else if(item.isDirectory) {
					var fd = new FormData();
					fd.append('folderid', target_id);
					fd.append('formtoken', obj.data('uploadformtoken'));
					fd.append('command', 'addfolder');
					fd.append('name', item.name);
					let fid = SeedDMSUpload.addSubFolder(fd);
					if(fid) {
//						obj.data('target', fid);
//						obj.data('droptarget', 'folder_'+fid);
						/* Set void afterupload to prevent tons of noty messages */
//						obj.data('afterupload', '()=>{}');
						var dirReader = item.createReader();
						dirReader.readEntries(function(entries) {
							SeedDMSUpload.handleFileUpload(fid, 'folder', entries, obj, statusbar);
						});
					}
					/* Just reload the parent folder */
					if(target_id == seeddms_folder) {
						$("div.ajax[data-action='folderList']").trigger('update', {folderid: seeddms_folder});
					}
				}
			}
		} else if(target_type == 'document' && target_id) {
			for (var i = 0; i < items.length; i++) {
				var item = items[i]; //.webkitGetAsEntry();
				if (item.isFile) {
					item.file(function(file) {
						if(file.size <= maxFileSize) {
							var fd = new FormData();
							fd.append('targettype', target_type);
							fd.append('documentid', target_id);
							fd.append('formtoken', obj.data('uploadformtoken'));
							fd.append('userfile', file);
							fd.append('command', 'updatedocument');

							var status = new SeedDMSUpload.createStatusbar(statusbar);
							status.setFileNameSize(file.name,file.size);
							SeedDMSUpload.sendFileToServer(fd,status);
							$("div.ajax[data-action='folderList']").trigger('update', {folderid: seeddms_folder});
						} else {
							noty({
								text: maxFileSizeMsg + '<br /><em>' + file.name + ' (' + file.size + ' Bytes)</em>',
								type: 'error',
								dismissQueue: true,
								layout: 'topRight',
								theme: 'defaultTheme',
								timeout: 5000
							});
						}
					});
				}
			}
		} else if(target_type == 'attachment' && target_id) {
			for (var i = 0; i < items.length; i++) {
				var item = items[i]; //.webkitGetAsEntry();
				if (item.isFile) {
					item.file(function(file) {
						if(file.size <= maxFileSize) {
							var fd = new FormData();
							fd.append('targettype', target_type);
							fd.append('documentid', target_id);
							fd.append('formtoken', obj.data('uploadformtoken'));
							fd.append('userfile', file);
							fd.append('command', 'addfile');

							var status = new SeedDMSUpload.createStatusbar(statusbar);
							status.setFileNameSize(file.name,file.size);
							SeedDMSUpload.sendFileToServer(fd,status, function(){
								$("div.ajax[data-action='documentFiles']").trigger('update', {documentid: target_id});
							});
						} else {
							noty({
								text: maxFileSizeMsg + '<br /><em>' + file.name + ' (' + file.size + ' Bytes)</em>',
								type: 'error',
								dismissQueue: true,
								layout: 'topRight',
								theme: 'defaultTheme',
								timeout: 5000
							});
						}
					});
				}
			}
		}
	}
}( window.SeedDMSUpload = window.SeedDMSUpload || {}, jQuery )); /* }}} */

$(document).ready(function() { /* {{{ */
	$(document).on('dragenter', "#draganddrophandler", function (e) {
		e.stopPropagation();
		e.preventDefault();
		$(this).css('border', '2px dashed #0B85A1');
	});
	$(document).on('dragleave', "#draganddrophandler", function (e) {
		$(this).css('border', '0px solid white');
	});
	$(document).on('dragover', "#draganddrophandler", function (e) {
		e.stopPropagation();
		e.preventDefault();
	});
	$(document).on('drop', "#draganddrophandler", function (e) {
		$(this).css('border', '0px dotted #0B85A1');
		e.preventDefault();

		attr_rel = $(this).data('droptarget');
		target_type = attr_rel.split("_")[0];
		target_id = attr_rel.split("_")[1];

		var files = e.originalEvent.dataTransfer.files;
		var items = e.originalEvent.dataTransfer.items;

		//We need to send dropped files to Server
		newitems = [];
		if(items.length > 0) {
			for (var i=0; i<items.length; i++) {
				newitems.push(items[i].webkitGetAsEntry());
			}
			SeedDMSUpload.handleFileUpload(target_id, target_type, newitems, $(this), $(this));
		}
	});

	$(document).on('dragenter', '.droptarget', function (e) {
		e.stopPropagation();
		e.preventDefault();
		$(e.currentTarget).css('border', '2px dashed #0B85A1');
	});
	$(document).on('dragleave', '.droptarget', function (e) {
		e.stopPropagation();
		e.preventDefault();
		$(e.currentTarget).css('border', '0px solid white');
	});
	$(document).on('dragover', '.droptarget', function (e) {
		e.stopPropagation();
		e.preventDefault();
	});
	$(document).on('drop', '.droptarget', function (e) {
		e.preventDefault();
		e.stopPropagation();
		$(e.currentTarget).css('border', '0px solid white');
		attr_rel = $(e.currentTarget).data('droptarget');
		target_type = attr_rel.split("_")[0];
		target_id = attr_rel.split("_")[1];
		target_name = $(e.currentTarget).data('name')+''; // Force this to be a string
		files = e.originalEvent.dataTransfer.files;
		items = e.originalEvent.dataTransfer.items;
		if(target_type == 'folder') {
			/* check for files, because items has an entry if no file was dropped */
			if(files.length > 0) {
//				console.log('Drop '+files.length+' files on '+target_type+' '+target_id);
				newitems = [];
				for (var i=0; i<items.length; i++) {
					newitems.push(items[i].webkitGetAsEntry());
				}
				SeedDMSUpload.handleFileUpload(target_id, target_type, newitems,$(e.currentTarget),$('div.statusbar-container h1')/*$(e.currentTarget).find("span")*/);
			} else {
				/* The data is passed in dataTransfer. The items are meaning less. */
				var source_info = JSON.parse(e.originalEvent.dataTransfer.getData("text"));
				source_type = source_info.type;
				source_id = source_info.id;
				formtoken = source_info.formtoken;
//				console.log('Drop '+source_type+' '+source_id+' on '+target_type+' '+target_id);
				if(source_type == 'document') {
					var bootbox_message = trans.confirm_move_document;
					if(source_info.name)
						bootbox_message += "<p> "+escapeHtml(source_info.name)+' <i class="fa fa-arrow-right"></i> '+escapeHtml(target_name)+"</p>";
					bootbox.dialog({
						"message" : bootbox_message,
						"buttons" : {
							"cancel" : {
								"label" : trans.cancel,
								"className" : "btn-secondary",
								"callback": function() {
								}
							},
							"move" : {
								"label" : "<i class='fa fa-remove'></i> "+trans.move_document,
								"className" : "btn-danger",
								"callback": function() {
									$.get(seeddms_webroot+'op/op.Ajax.php',
										{ command: 'movedocument', docid: source_id, targetfolderid: target_id, formtoken: formtoken },
										function(data) {
											if(data.success) {
												$('#table-row-document-'+source_id).hide('slow');
												noty({
													text: data.message,
													type: 'success',
													dismissQueue: true,
													layout: 'topRight',
													theme: 'defaultTheme',
													timeout: 1500
												});
											} else {
												noty({
													text: data.message,
													type: 'error',
													dismissQueue: true,
													layout: 'topRight',
													theme: 'defaultTheme',
													timeout: 3500
												});
											}
										},
										'json'
									);
								}
							}
						}
					});

					url = seeddms_webroot+"out/out.MoveDocument.php?documentid="+source_id+"&targetid="+target_id;
		//			document.location = url;
				} else if(source_type == 'folder' && source_id != target_id) {
					var bootbox_message = trans.confirm_move_folder;
					if(source_info.name)
						bootbox_message += "<p> "+escapeHtml(source_info.name)+' <i class="fa fa-arrow-right"></i> '+escapeHtml(target_name)+"</p>";
					bootbox.dialog({
						"message" : bootbox_message,
						"buttons" : {
							"cancel" : {
								"label" : trans.cancel,
								"className" : "btn-secondary",
								"callback": function() {
								}
							},
							"move" : {
								"label" : "<i class='fa fa-arrow-right'></i> "+trans.move_folder,
								"className" : "btn-danger",
								"callback": function() {
									$.get(seeddms_webroot+'op/op.Ajax.php',
										{ command: 'movefolder', folderid: source_id, targetfolderid: target_id, formtoken: formtoken },
										function(data) {
											if(data.success) {
												$('#table-row-folder-'+source_id).hide('slow');
												noty({
													text: data.message,
													type: 'success',
													dismissQueue: true,
													layout: 'topRight',
													theme: 'defaultTheme',
													timeout: 1500
												});
											} else {
												noty({
													text: data.message,
													type: 'error',
													dismissQueue: true,
													layout: 'topRight',
													theme: 'defaultTheme',
													timeout: 3500
												});
											}
										},
										'json'
									);
								}
							}
						}
					});

					url = seeddms_webroot+"out/out.MoveFolder.php?folderid="+source_id+"&targetid="+target_id;
		//			document.location = url;
				}
			}
		} else if(target_type == 'document') {
			/* check for files, because items has an entry if no file was dropped */
			if(files.length > 0) {
//				console.log('Drop '+files.length+' files on '+target_type+' '+target_id);
				if(files.length > 1) {
					noty({
						text: trans.must_drop_one_file,
						type: 'error',
						dismissQueue: true,
						layout: 'topRight',
						theme: 'defaultTheme',
						timeout: 5000
					});
				} else if(1) {
					newitems = [];
					for (var i=0; i<items.length; i++) {
						newitems.push(items[i].webkitGetAsEntry());
					}
					bootbox.dialog({
						"message" : trans.confirm_upload_new_version,
						"buttons" : {
							"cancel" : {
								"label" : trans.cancel,
								"className" : "btn-secondary",
								"callback": function() {
								}
							},
							"newversion" : {
								"label" : "<i class='fa fa-link'></i> "+trans.upload_new_version,
								"className" : "btn-danger",
								"callback": function() {
									SeedDMSUpload.handleFileUpload(target_id, target_type, newitems,$(e.currentTarget),$('div.statusbar-container h1'));
								}
							}
						}
					});
				}
			} else {
				var source_info = JSON.parse(e.originalEvent.dataTransfer.getData("text"));
				source_type = source_info.type;
				source_id = source_info.id;
				formtoken = source_info.formtoken;
//				console.log('Drop '+source_type+' '+source_id+' on '+target_type+' '+target_id);
				if(source_type == 'document') {
					if(source_id != target_id) {
						bootbox.dialog({
							"message" : trans.confirm_transfer_link_document,
							"buttons" : {
								"cancel" : {
									"label" : trans.cancel,
									"className" : "btn-secondary",
									"callback": function() {
									}
								},
								"transfer": {
									"label" : "<i class='fa fa-arrow-right'></i> "+trans.transfer_content,
									"className" : "btn-danger",
									"callback": function() {
										$.get(seeddms_webroot+'op/op.Ajax.php',
											{ command: 'transfercontent', docid: source_id, targetdocumentid: target_id, formtoken: formtoken },
											function(data) {
												if(data.success) {
													$('#table-row-document-'+source_id).hide('slow');
													noty({
														text: data.message,
														type: 'success',
														dismissQueue: true,
														layout: 'topRight',
														theme: 'defaultTheme',
														timeout: 1500
													});
												} else {
													noty({
														text: data.message,
														type: 'error',
														dismissQueue: true,
														layout: 'topRight',
														theme: 'defaultTheme',
														timeout: 3500
													});
												}
											},
											'json'
										);
									}
								},
								"link" : {
									"label" : "<i class='fa fa-link'></i> "+trans.link_document,
									"className" : "btn-danger",
									"callback": function() {
										$.get(seeddms_webroot+'op/op.Ajax.php',
											{ command: 'linkdocument', docid: source_id, targetdocumentid: target_id, formtoken: formtoken },
											function(data) {
												if(data.success) {
													noty({
														text: data.message,
														type: 'success',
														dismissQueue: true,
														layout: 'topRight',
														theme: 'defaultTheme',
														timeout: 1500
													});
												} else {
													noty({
														text: data.message,
														type: 'error',
														dismissQueue: true,
														layout: 'topRight',
														theme: 'defaultTheme',
														timeout: 3500
													});
												}
											},
											'json'
										);
									}
								}
							}
						});
					}
					url = seeddms_webroot+"out/out.MoveDocument.php?documentid="+source_id+"&targetid="+target_id;
		//			document.location = url;
				}
			}
		} else if(target_type == 'attachment') {
			if(files.length > 0) {
				newitems = [];
				for (var i=0; i<items.length; i++) {
					newitems.push(items[i].webkitGetAsEntry());
				}
				SeedDMSUpload.handleFileUpload(target_id, target_type, newitems,$(e.currentTarget),$('div.statusbar-container h1')/*$(e.currentTarget).find("span")*/);
			}
		}
	});
	$(document).on('dragstart', '.table-row-folder', function (e) {
		attr_rel = $(e.target).attr('rel');
		if(typeof attr_rel == 'undefined')
			return;
		var dragStartInfo = {
			id : attr_rel.split("_")[1],
			type : "folder",
			formtoken : $(e.target).attr('formtoken'),
			name: $(e.target).data('name')+''
		};
		/* Currently not used
		$.ajax({url: '../out/out.ViewFolder.php',
			type: 'GET',
			dataType: "json",
			data: {action: 'data', folderid: attr_rel.split("_")[1]},
			success: function(data) {
				if(data) {
					dragStartInfo.source = data;
				}
			},
			timeout: 3000
		});
		*/
		e.originalEvent.dataTransfer.setData("text", JSON.stringify(dragStartInfo));
	});

	$(document).on('dragstart', '.table-row-document', function (e) {
		attr_rel = $(e.target).attr('rel');
		if(typeof attr_rel == 'undefined')
			return;
		var dragStartInfo = {
			id : attr_rel.split("_")[1],
			type : "document",
			formtoken : $(e.target).attr('formtoken'),
			name: $(e.target).data('name')+''
		};
		e.originalEvent.dataTransfer.setData("text", JSON.stringify(dragStartInfo));
	});

	/* Dropping item on alert below clipboard */
	$(document).on('dragenter', '.add-clipboard-area', function (e) {
		e.stopPropagation();
		e.preventDefault();
		$(this).css('border', '2px dashed #0B85A1');
	});
	$(document).on('dragleave', '.add-clipboard-area', function (e) {
		$(this).css('border', '0px solid white');
	});
	$(document).on('dragover', '.add-clipboard-area', function (e) {
		e.preventDefault();
	});
	$(document).on('drop', '.add-clipboard-area', function (e) {
		$(this).css('border', '0px dotted #0B85A1');
		onAddClipboard(e);
	});

	$("#jqtree").on('dragenter', function (e) {
		attr_rel = $(e.srcElement).attr('rel');
		if(typeof attr_rel == 'undefined')
			return;
		$(e.target).parent().css('border', '1px dashed #0B85A1');
		e.stopPropagation();
		e.preventDefault();
	});
	$("#jqtree").on('dragleave', function (e) {
		attr_rel = $(e.srcElement).attr('rel');
		if(typeof attr_rel == 'undefined')
			return;
		$(e.target).parent().css('border', '0px solid white');
		e.stopPropagation();
		e.preventDefault();
	});
	$("#jqtree").on('dragover', function (e) {
		e.stopPropagation();
		e.preventDefault();
	});
	$("#jqtree").on('drop', function (e) {
		e.stopPropagation();
		e.preventDefault();
		attr_rel = $(e.target).attr('rel');
		if(typeof attr_rel == 'undefined')
			return;
		$(e.target).parent().css('border', '1px solid white');
		target_type = attr_rel.split("_")[0];
		target_id = attr_rel.split("_")[1];
		var source_info = JSON.parse(e.originalEvent.dataTransfer.getData("text"));
		source_type = source_info.type;
		source_id = source_info.id;
		formtoken = source_info.formtoken;
		if(source_type == 'document') {
			bootbox.dialog(trans.confirm_move_document, [{
				"label" : "<i class='fa fa-remove'></i> "+trans.move_document,
				"class" : "btn-danger",
				"callback": function() {
					$.get(seeddms_webroot+'op/op.Ajax.php',
						{ command: 'movedocument', docid: source_id, targetfolderid: target_id, formtoken: formtoken },
						function(data) {
							if(data.success) {
								$('#table-row-document-'+source_id).hide('slow');
								noty({
									text: data.message,
									type: 'success',
									dismissQueue: true,
									layout: 'topRight',
									theme: 'defaultTheme',
									timeout: 1500
								});
							} else {
								noty({
									text: data.message,
									type: 'error',
									dismissQueue: true,
									layout: 'topRight',
									theme: 'defaultTheme',
									timeout: 3500
								});
							}
						},
						'json'
					);
				}
			}, {
				"label" : trans.cancel,
				"class" : "btn-cancel",
				"callback": function() {
				}
			}]);

			url = seeddms_webroot+"out/out.MoveDocument.php?documentid="+source_id+"&targetid="+target_id;
//			document.location = url;
		} else if(source_type == 'folder' && source_id != target_id) {
			bootbox.dialog(trans.confirm_move_folder, [{
				"label" : "<i class='fa fa-arrow-right'></i> "+trans.move_folder,
				"class" : "btn-danger",
				"callback": function() {
					$.get(seeddms_webroot+'op/op.Ajax.php',
						{ command: 'movefolder', folderid: source_id, targetfolderid: target_id, formtoken: formtoken },
						function(data) {
							if(data.success) {
								$('#table-row-folder-'+source_id).hide('slow');
								noty({
									text: data.message,
									type: 'success',
									dismissQueue: true,
									layout: 'topRight',
									theme: 'defaultTheme',
									timeout: 1500
								});
							} else {
								noty({
									text: data.message,
									type: 'error',
									dismissQueue: true,
									layout: 'topRight',
									theme: 'defaultTheme',
									timeout: 3500
								});
							}
						},
						'json'
					);
				}
			}, {
				"label" : trans.cancel,
				"class" : "btn-cancel",
				"callback": function() {
				}
			}]);

			url = seeddms_webroot+"out/out.MoveFolder.php?folderid="+source_id+"&targetid="+target_id;
//			document.location = url;
		}
	});

	$('div.splash').each(function(index) {
		var element = $(this);
		var msgtype = element.data('type');
		var timeout = element.data('timeout');
		var msg = element.text();
		noty({
			text: msg,
			type: msgtype,
			dismissQueue: true,
			layout: 'topRight',
			theme: 'defaultTheme',
			timeout: (typeof timeout == 'undefined' ? 1500 : timeout)
		});
	});

	$("body").on("click", "span.openpopupbox", function(e) {
		$(""+$(e.target).data("href")).toggle();
		e.stopPropagation();
	});
	$("body").on("click", "span.openpopupbox i", function(e) {
		$(e.target).parent().click();
	});
	$("body").on("click", "span.openpopupbox span", function(e) {
		$(e.target).parent().click();
	});
	$("body").on("click", "span.closepopupbox", function(e) {
		$(this).parent().hide();
		e.stopPropagation();
	});

	$("body").on("mouseenter", "#main-menu-dropfolderlist div.dropdown-menu  a", function(e) {
		$(e.currentTarget).find('.dropfolder-menu-img').css('display', 'inline');
	});
	$("body").on("mouseleave", "#main-menu-dropfolderlist div.dropdown-menu  a", function(e) {
		$(e.currentTarget).find('.dropfolder-menu-img').hide();
	});

}); /* }}} */

$(document).ready(function() { /* {{{ */
	$('body').on('click.modal.data-api', '[data-toggle="modal"]', function(){
		if($(this).attr("href"))
			$($(this).data("target")+' .modal-body').load($(this).attr('href'));
	});
}); /* }}} */

(function( SeedDMSTask, $, undefined ) { /* {{{ */
	var approval_count, review_count, workflow_count;
	var timeout = 1000;
	var counter = 0;
	var tasks = Array(
		{name: 'checktasks', interval: 15, func: 
			checkTasks = function() {
				$.ajax({url: seeddms_webroot+'out/out.Tasks.php',
					type: 'GET',
					dataType: "json",
					data: {action: 'counttasks'},
					success: function(data) {
						if(data) {
							if((typeof data.data.approval != 'undefined' && approval_count != data.data.approval) ||
								 (typeof data.data.review != 'undefined' && review_count != data.data.review) ||
								 (typeof data.data.workflow != 'undefined' && workflow_count != data.data.workflow)) {
		//						$("#menu-tasks").html('Loading').hide().load('../out/out.Tasks.php?action=menutasks').fadeIn('500')
								$('#menu-tasks > div.ajax').trigger('update', {folderid: seeddms_folder});
								approval_count = typeof data.data.approval != 'undefined' ? data.data.approval : 0;
								review_count = typeof data.data.review != 'undefined' ? data.data.review : 0;
								workflow_count = typeof data.data.workflow != 'undefined' ? data.data.workflow : 0;
							}
						}
					},
					timeout: 3000
				}); 
			}
		}
	);

	SeedDMSTask.add = function(task) {
		return tasks.push(task);
	}

	SeedDMSTask.run = function() {
		for(let task of tasks) {
			if(counter % task.interval == 0) {
//			console.log("Running task '" + task.name + "'");
				task.func(task);
			}
		}
		//console.log(counter);
		counter++;
		timeOutId = setTimeout(SeedDMSTask.run, timeout);
	}
}( window.SeedDMSTask = window.SeedDMSTask || {}, jQuery )); /* }}} */

(function( SeedDMSAjax, $, undefined ) { /* {{{ */
	var tasks = Array(
		{name: 'test', view: 'null', action: null, func: 
			test = function() {
				console.log('Run in SeedDMSAjax');
			}
		}
	);

	SeedDMSAjax.add = function(task) {
		tasks.push(task);
	}

	SeedDMSAjax.run = function(view, action) {
		for(let task of tasks) {
			//console.log('Checking for '+view+':'+action);
			if(task.view == null || (task.view == view && task.action == null) || (task.view == view && task.action == action)) {
				//console.log('Running '+task.name+' after update for '+view+':'+action);
				task.func();
			}
		}
	}
}( window.SeedDMSAjax = window.SeedDMSAjax || {}, jQuery )); /* }}} */

(function( SeedDMSBox, $, undefined ) { /* {{{ */
	/* Open confirm box (which has just one callback) and
	 * redirect to the given url if confirm was pressed
	 */
	SeedDMSBox.redirect = function(url, boxparams) {
		bootbox.confirm({
			"message": boxparams.message,
			"buttons": {
				"confirm": {
					"label" : boxparams.confirmLabel,
					"className" : "btn-danger",
				},
				"cancel": {
					"label" : boxparams.cancelLabel,
					"className" : "btn-secondary",
				}
			},
			"callback": function(result) {
				if(result) {
					window.location.href = url;
				}
			}
		});
	}

	/* Open confirm box (which has just one callback) and
	 * calls the callback if the confirm button was pressed
	 */
	SeedDMSBox.callback = function(callback, boxparams) {
		bootbox.confirm({
			"message": boxparams.message,
			"buttons": {
				"confirm": {
					"label" : boxparams.confirmLabel,
					"className" : "btn-danger",
				},
				"cancel": {
					"label" : boxparams.cancelLabel,
					"className" : "btn-secondary",
				}
			},
			"callback": function(result) {
				if(result) {
					callback();
				}
			}
		});
	}
}( window.SeedDMSBox = window.SeedDMSBox || {}, jQuery )); /* }}} */
