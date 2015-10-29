/* global $, Vue, document, JSONEditor, nColumns */
'use strict';

var JSONEditorOptions = { mode: "code" };
var pc = require("paperclip/lib/node.js");

pc.modifiers.get = function (input, key) {
  return input[key];
};
pc.modifiers.len = function (input, key) {
  if (key !== undefined) {
    input = input[key]
  }
  if (input === null || input === undefined) {
    return  0;
  }
  else {
    return input.length;
  }
};
pc.modifiers.plus = function (input, nb) {
  if (nb === undefined) {
    nb = 1
  }
  return parseInt(input) + parseInt(nb);
};

var view = function(id, mdl) {
  var n = document.getElementById(id)
  var t = n.innerHTML.replace(/\[\[/g, '{{').replace(/\]\]/g, '}}');
  var v = pc.template(t, pc).view(mdl);
  n.parentNode.insertBefore(v.render(), n);
  return v;
}


$(document).ready(function() {
    Vue.config.debug = true;
    var oboe = require('oboe');
    var nTables = 0;


    var viewList = view('table-items-list', {
        items: []
    });

    var viewTable = view('modal-edit-table', {
        handleSave : function(event) {
          var url = '/-/v3/settab' + document.location.pathname.replace(/\/+$/,'').concat('/');
          var form = {
            "name": viewTable.get('_wid'),
            "title": viewTable.get('title'),
            "description" :  $('#modal-edittable-input-description').val()
          };
          $.ajax({
              type: "POST",
              url: url,
              data: form,
              success: function(data) {
                document.location.href = "/";
              }
          });
          return false;
        },
        handleDrop: function(event) {
          var url = '/-/v3/settab' + document.location.pathname.replace(/\/+$/,'').concat('/');
          var form = {};
          form[document.location.pathname.replace(/^\/+/, '').replace(/\/$/, '')] = true;
          $.ajax({
              type: "POST",
              url: url ,
              data: form,
              success: function(data) {
                document.location.href = "/";
              }
          });
          return false;
        }

    });

    oboe(window.location.href.replace(/\/+$/,'') + '/*')
    .node('!.*', function(item) {
        var items = viewList.get('items');
        items.push(item);
        viewList.set('items', items);
    })
    .done(function(items) {
        $("#table-items table").resizableColumns();
    })
    oboe(window.location.protocol + '//' + window.location.host + '/index/$count').done(function(items) {
        nTables = items[0].value;
    })
    oboe(window.location.protocol + '//' + window.location.host + '/index' + document.location.pathname.replace(/\/+$/,'') +'/*?alt=raw').done(function(items) {
        viewTable.set('title', items[0].title);
        viewTable.set('description', items[0].description);
        viewTable.set('_wid', items[0]._wid);
        $('#modal-edittable-input-description').wysihtml5();
    })

    var EditColumnVue = new Vue( {
        el: '#modal-editcolumn',
        data: {
          "previousScheme": "",
          "previousType": "",
          "previousValue" : {},
          "previousName" : "",
          "previousLabel" : "",
          "previousComment" : "",
          "propertyScheme": "",
          "propertyType": "",
          "propertyValue" : {},
          "propertyName" : "",
          "propertyLabel" : "",
          "propertyComment" : ""
        },
        ready: function() {
          var JSONEditorContainerValue = document.getElementById("modal-editcolumn-jsoneditor-value");
          this.JSONEditorHandleValue = new JSONEditor(JSONEditorContainerValue, JSONEditorOptions);
          var JSONEditorContainerLink= document.getElementById("modal-editcolumn-jsoneditor-link");
          this.JSONEditorHandleLink = new JSONEditor(JSONEditorContainerLink, JSONEditorOptions);
        },
        filters: {
        },
        methods: {
          setField: function (column) {
            console.log('column', column);
            var value = column;
            delete value.scheme;
            delete value.label;
            delete value.name;
            delete value.type;
            delete value.comment;
            var self = this;
            self.propertyLabel = column.label || '';
            self.previousLabel = column.label || '';
            self.propertyValue = value || {};
            self.previousValue = value || {};
            self.propertyName = column.name || '';
            self.previousName = column.name || '';
            self.propertyScheme = column.scheme || '';
            self.previousScheme = column.scheme || '';
            self.propertyType= column.type || '';
            self.previousType = column.type || '';
            self.propertyComment = column.comment || '';
            self.previousComment = column.comment || '';
            self.propertyText = column.text || {};
            self.previousText = column.text || {};
            self.JSONEditorHandleValue.set(self.propertyValue);
            self.JSONEditorHandleLink.set(self.propertyText);
          },
          drop: function() {
            var url = '/-/v3/setcol' + document.location.pathname.replace(/\/+$/,'') + '/' + this.propertyName + '/';
            var form = {};
            form[this.propertyName] = true;
            $.ajax({
                type: "POST",
                url: url ,
                data: form,
                success: function(data) {
                  document.location.href= document.location.pathname;
                }
            });
          },
          save : function() {
            this.propertyValue = this.JSONEditorHandleValue.get();
            this.propertyText = this.JSONEditorHandleLink.get();
            this.propertyType = $("#modal-editcolumn-tab-list li.active").data('type')
            var url = '/-/v3/setcol' + document.location.pathname.replace(/\/+$/,'') + '/' + this.propertyName + '/';
            $.ajax({
                type: "POST",
                url: url ,
                data: {
                  "previousScheme": this.previousScheme,
                  "previousValue" : this.previousValue,
                  "previousName" : this.previousName,
                  "previousLabel" : this.previousLabel,
                  "previousComment" : this.previousComment,
                  "previousText" : this.previousText,
                  "propertyScheme": this.propertyScheme,
                  "propertyValue" : this.propertyValue,
                  "propertyName" : this.propertyName,
                  "propertyLabel" : this.propertyLabel,
                  "propertyComment" : this.propertyComment,
                  "propertyText" : this.propertyText,
                },
                success: function(data) {
                  document.location.href= document.location.pathname;
                }
            });

          }
        }
      }
    );
    var fileToLoad = '';
    var je1 = new JSONEditor(document.getElementById("modal-load-tab2-jsoneditor-label"), JSONEditorOptions);
    je1.set({ set : 'Undefined label'});
    var je2 = new JSONEditor(document.getElementById("modal-load-tab2-jsoneditor-text"), JSONEditorOptions);
    je2.set({ set : 'n/a'});
    var je3 = new JSONEditor(document.getElementById("modal-load-tab2-jsoneditor-hash"), JSONEditorOptions);
    je3.set({ set : null});


    $('#modal-load-input-filename').change(function() {
        var t = $(this).val();
        $('#modal-load-input-file').val(t);
    });
    $('#modal-load-input-filename').fileupload({
        dataType: 'json',
        send:  function (e, data) {
          $('#modal-load-input-file-label').hide(4, function() {
              $('#modal-load-input-file-indicator').show().html('0%');
          });
        },
        done: function (error, data) {
          if (Array.isArray(data.result) && data.result[0]) {
            fileToLoad = data.result[0];
          }
          $('#modal-load-input-file-indicator').html('100%');
          $('#modal-load-tab-file > div').addClass("has-success has-feedback");
          $('#modal-load-tab-file .form-control-feedback').show();
          setTimeout(function() {
              $('#modal-load-input-file-indicator').hide(4, function() {
                  $('#modal-load-input-file-label').show();
              });
          }, 2500);
        },
        progressall: function (e, data) {
          var progress = parseInt(data.loaded / data.total * 100, 10);
          $('#modal-load-input-file-indicator').html(progress + '%');
        }
    });
    $('#modal-load-submit').click(function() {
        var formData = {
          loader : $("#modal-load-er").val(),
          keyboard : $('#modal-load-input-keyboard').val(),
          file   : fileToLoad,
          uri    : $("#modal-load-input-uri").val(),
          type   : $("#modal-load-tab-list li.active").data('type'),
          text   : je2.get(),
          hash   : je3.get(),
          label  : je1.get()
        }
        if (formData[formData.type] === undefined || formData[formData.type] === '') {
          return false;
        }
        $.ajax({
            type: "POST",
            url: "/-/v3/load",
            data: formData,
            success: function(data) {
              document.location.href= document.location.pathname;
            }
        });
        fileToLoad = '';
    });


    $('.action-editcolumn').click(function (e) {
        var c = $(this).data("column")
        c.name = $(this).data("column-name")
        EditColumnVue.setField(c);
        $('#modal-editcolumn').modal('toggle');
        return false;
    });
    $('#action-editcolumn-save').click(function (e) {
        EditColumnVue.save($(this).data("field"));
        $('#modal-editcolumn').modal('hide');
        return false;
    });
    $('#action-editcolumn-drop').click(function (e) {
        EditColumnVue.drop();
        $('#modal-editcolumn').modal('hide');
        return false;
    });
    $('#action-newtable').click(function() {
        var rsc = 't' + (nTables + 1);
        var url = '/-/v3/settab/' + rsc + '/';
        $.ajax({
            type: "POST",
            url: url ,
            data: {},
            success: function(data) {
              document.location.href = '/' + rsc;
            }
        });
        return false;
    });
    $('#action-droptable').click(function() {
        alert('Not yet implemented');
        return false;
    });
    $('#action-newcolumn').click(function() {
        var url = '/-/v3/setcol' + document.location.pathname.replace(/\/+$/,'') + '/c' + (nColumns + 1) + '/';
        $.ajax({
            type: "POST",
            url: url ,
            data: {},
            success: function(data) {
              document.location.href= document.location.pathname;
            }
        });
        return false;
    });
    $('#action-download-csv').click(function() {
        document.location.href= document.location.pathname.replace(/\/+$/,'') + '/*/?alt=csv';
        return false;
    });
    $('#action-download-nq').click(function() {
        document.location.href= document.location.pathname.replace(/\/+$/,'') + '/*/?alt=nq';
        return false;
    });
    $('#action-download-json').click(function() {
        document.location.href= document.location.pathname.replace(/\/+$/,'') + '/*/?alt=json';
        return false;
    });



    /*
     $('#modal-editcolumn-input-scheme').typeahead({
         local: ['http://schema.org/url','http://schema.org/name','http://schema.org/description','http://schema.org/image']
     });
     */



    $(".modal").on("show.bs.modal", function() {
        var height = $(window).height() / 2;
        $(this).find(".modal-body").css("min-height", Math.round(height));
    });
});

