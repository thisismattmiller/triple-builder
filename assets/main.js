
    var style = [
          {
            "selector": "node",
            "style": {
              "height": 40,
              "width": 40,
              "background-color": "#ccc",
              "label": "data(label)"
            }
          },

          {
            "selector": "edge",
            "style": {
              "label": "data(label)",
              "width": 3,
              "line-color": "#ccc",
              "mid-target-arrow-shape": "triangle",
              "mid-target-arrow-color": "#ccc",
              "mid-target-arrow-fill" : "filled",
              "arrow-scale" : 3
            }
          },

          {
            "selector": ".top-left",
            "style": {
              "text-valign": "top",
              "text-halign": "left"
            }
          },

          {
            "selector": ".top-center",
            "style": {
              "text-valign": "top",
              "text-halign": "center"
            }
          },

          {
            "selector": ".top-right",
            "style": {
              "text-valign": "top",
              "text-halign": "right"
            }
          },

          {
            "selector": ".center-left",
            "style": {
              "text-valign": "center",
              "text-halign": "left"
            }
          },

          {
            "selector": ".center-center",
            "style": {
              "text-valign": "center",
              "text-halign": "center"
            }
          },

          {
            "selector": ".center-right",
            "style": {
              "text-valign": "center",
              "text-halign": "right"
            }
          },

          {
            "selector": ".bottom-left",
            "style": {
              "text-valign": "bottom",
              "text-halign": "left"
            }
          },

          {
            "selector": ".bottom-center",
            "style": {
              "text-valign": "bottom",
              "text-halign": "center"
            }
          },

          {
            "selector": ".bottom-right",
            "style": {
              "text-valign": "bottom",
              "text-halign": "right"
            }
          },

          {
            "selector": ".multiline-manual",
            "style": {
              "text-wrap": "wrap"
            }
          },

          {
            "selector": ".multiline-auto",
            "style": {
              "text-wrap": "wrap",
              "text-max-width": 80
            }
          },

          {
            "selector": ".autorotate",
            "style": {
              "edge-text-rotation": "autorotate"
            }
          },
          {
            "selector": ".literal",
            "style": {
              "background-opacity": 0
            }
          },

          {
            "selector": ".background",
            "style": {
              "text-background-opacity": 1,
              "text-background-color": "#ccc",
              "text-background-shape": "roundrectangle",
              "text-border-color": "#000",
              "text-border-width": 1,
              "text-border-opacity": 1
            }
          },

          {
            "selector": ".outline",
            "style": {
              "text-outline-color": "#ccc",
              "text-outline-width": 3
            }
          }
        ]





$( document ).ready(function() {
  // Handler for .ready() called.
  $.getJSON( "/assets/vocabs.json")
    .done(function( json ) {
      window.vocabs = json;
      window.sheetIDName = '#myTriplesSheet';
      buildPrefixLookup();
      filterVocabs();
      initSpreadSheet();
      checkForBlankRow();
      bindTabs();
      $('#your-graph').show();
      buildCytoGraphData(window.graphData.graph);
      buildVocabsList();
      bindShareTabElements();


    })
    .fail(function( ) {
      alert('There was an error loading the vocabularies. Try refreshing the page.')
    })

  var resizeTimer;

  $(window).on('resize', function(e) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      resizeSpreadSheet()
    }, 250);
  });


});

var buildPrefixLookup = function(){
  window.prefixLookup = {}
  // use the vocab data  
  for (var x in window.vocabs){
    window.prefixLookup[window.vocabs[x]['prefix']] = window.vocabs[x]['namespace']
  }
  // TODO allow custom namespaces
  window.prefixLookup['sandbox'] = 'http://sandbase.semlab.io/entity/'
  // window.prefixLookup['isni'] = 'http://www.isni.org/isni/'
  window.prefixLookup['wd'] = 'https://www.wikidata.org/entity/'
  window.prefixLookup['example'] = 'http://www.example.com/'
  window.prefixLookup['example'] = 'https://www.example.com/'
  window.prefixLookup['fake'] = 'http://www.fake.com/'
  window.prefixLookup['fake'] = 'https://www.fake.com/'
  window.prefixLookup['dc'] = 'https://www.fake.com/'


  // http://purl.org/dc/elements/1.1/description
}


var bindShareTabElements = function(){

  // try to limit chars enetered
  $('#share-shareid').keypress(function (e) {
      var regex = new RegExp("^[a-zA-Z0-9\-_]+$");
      var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
      if (regex.test(str)) {
          return true;
      }

      e.preventDefault();
      return false;
  });


  $('#share-shareid-set').click(function(){
    setShareId($('#share-shareid').val())
  })

  if (window.shareId){
    setShareLink(window.shareId)
  }
  if (window.graphData.text){
    $("#share-text").val(window.graphData.text)
  }

  var shareTextTimer;



  $('#share-text').keypress(function (e) {
    clearTimeout(shareTextTimer);
    shareTextTimer = setTimeout(function() {
      saveData();
    }, 1000);


  });


  $("#share-lock-nodes").click(function(){
    window.nodePositionsLock = $('#share-lock-nodes').is(':checked')
    saveData();
  })




}

var bindTabs = function(){

  $(".tab-link").click(function() {
    // console.log($(this));
    if (!$(this).parent().hasClass( "is-active" )){

      // before we move off the graph tab go on get your camera phone, take a picture
      if ($(".tabs li.is-active").attr('id') === 'tab-graph-li'){        
        setCyImage();
        if (!$("#share-img-preview").attr('src')){
          saveCyImage()
        }
      }


      $(".tabs li").removeClass("is-active");
      $(this).parent().toggleClass("is-active");
      $(".content-area").hide();
      $('#'+$(this).data('target')).show();

      // some extra functionality
      if ($(this).parent().attr('id') === 'tab-triples-li'){
        updateTriples();
      }

      if ($(this).parent().attr('id') === 'tab-share-li'){
          
        if (!window.shareId){
          getShareId();
        } 

        if (window.nodePositionsLock){
          $("#share-lock-nodes").prop('checked', true);
        }else{
          $("#share-lock-nodes").prop('checked', false);
        }

        if (!window.shareId){
          $("#share-create").show()
          $("#share-edit").hide()
        }else{
          $("#share-create").hide()
          $("#share-edit").show()

        }

      }




    }
  })
}


var setShareId = function(id){


  var payload = {
    uuid: window.subsetID,
    shareId : id
  }

  $.ajax({
      url:"/shortid/",
      method:"POST", //First change type to method here

      data:JSON.stringify(payload),
      contentType:"application/json; charset=utf-8",
      success:function(response) {
        if (!response){
          $("#share-shareid-error").show();
          $("#share-shareid").focus();

        }else{
          $("#share-create").hide()
          $("#share-edit").show()
          window.shareId = response;
          setShareLink(window.shareId);
          saveData();
          saveCyImage();
        }


     },
     error:function(obj,error){
     console.log(error)      
      if (typeof callback !== 'undefined') callback('error',null)        
     }

  });
}


var getShareId = function(){
  $.getJSON( "/shortid", function( data ) {   
      $("#share-shareid").val(data)
  });
}
var setShareLink = function(id){
  $("#share-link").attr('href','/share/'+id)
  $("#share-link").text('https://tb.semlab.io/share/'+id)


  $("#share-link-nt").attr('href','https://tb.semlab.io/share/'+id + '.nt')
  $("#share-link-nt").text('https://tb.semlab.io/share/'+id + '.nt')


  $("#share-link-ttl").attr('href','https://tb.semlab.io/share/'+id + '.ttl')
  $("#share-link-ttl").text('https://tb.semlab.io/share/'+id + '.ttl')


  $("#share-link-jsonld").attr('href','https://tb.semlab.io/share/'+id + '.jsonld')
  $("#share-link-jsonld").text('https://tb.semlab.io/share/'+id + '.jsonld')

  

}

var buildVocabsList = function(){

  $("#vocab-table").empty()
  for (var group in window.vocabsByGroups){
    for (var v in window.vocabsByGroups[group]){
      var name = window.vocabsByGroups[group][v].name;
      var group = window.vocabsByGroups[group][v].group;
      var doc = window.vocabsByGroups[group][v].doc;
      var namespace = window.vocabsByGroups[group][v].namespace;
      var prefix = window.vocabsByGroups[group][v].prefix;

      var classes = window.vocabsByGroups[group][v].classes.length;
      var properties = window.vocabsByGroups[group][v].properties.length;

      var tr = '<tr>';
      tr = tr + '<td><input class="vocab-table-enable" data-name="'+name+'" type="checkbox" checked></td>'
      tr = tr + '<td>'+name+'</td>'
      tr = tr + '<td>'+group+'</td>'
      tr = tr + '<td><a href="'+doc+'" target="_blank">View Docs</a></td>'
      tr = tr + '<td>'+namespace+'</td>'
      tr = tr + '<td>'+prefix+'</td>'
      tr = tr + '<td>'+classes+'</td>'
      tr = tr + '<td>'+properties+'</td>'
      tr = tr + '</tr>';
      $('#vocab-table').append( tr );
    }
  }

  $(".vocab-table-enable").click(function(){
    filterVocabs();
    resizeSpreadSheet();
  })


  $("#example-dropdown").change(function(){
    if ($( this ).val() === 'Examples'){
      return false
    }
    if (!window.confirm('This will delete any existing triples, okay?')){
      $( this ).val('Examples')
      return false
    }
    if ($( this ).val() === 'FOAF Example'){
      var data = [["http://sandbase.semlab.io/entity/Q3","http://xmlns.com/foaf/0.1/name","Matt Miller","@en-English"],["http://sandbase.semlab.io/entity/Q3","http://www.w3.org/1999/02/22-rdf-syntax-ns#type","http://xmlns.com/foaf/0.1/Person",""],["http://sandbase.semlab.io/entity/Q3","http://xmlns.com/foaf/0.1/depiction","https://pbs.twimg.com/profile_images/877555359967318016/vY0Wruzk_400x400.jpg","URL"],["http://sandbase.semlab.io/entity/Q3","http://xmlns.com/foaf/0.1/birthday","02-03","^^xsd:gMonthDay"],["http://sandbase.semlab.io/entity/Q3","http://xmlns.com/foaf/0.1/homepage","http://www.thisismattmiller.com","URL"],["http://sandbase.semlab.io/entity/Q3","http://xmlns.com/foaf/0.1/based_near","https://www.wikidata.org/entity/Q60",""],["https://www.wikidata.org/entity/Q60","http://www.w3.org/2000/01/rdf-schema#label","New York City","^^xsd:string"],["http://www.isni.org/isni/0000000126452986","http://xmlns.com/foaf/0.1/name","Cristina Pattuelli",""],["http://www.isni.org/isni/0000000126452986","http://www.w3.org/1999/02/22-rdf-syntax-ns#type","http://xmlns.com/foaf/0.1/Person",""],["http://sandbase.semlab.io/entity/Q3","http://xmlns.com/foaf/0.1/knows","http://www.isni.org/isni/0000000126452986",""],["","","",""]]
      initSpreadSheet(data)
      dataChanged();
      dataChanged();
    }
  })





}

var filterVocabs = function(){


  var exclude = []
  
  $(".vocab-table-enable").each(function(x){
    if (!$(this).is(':checked')){
      exclude.push($(this).data('name'))
    }
  })


  window.vocabsFilteredClasses = []
  window.vocabsFilteredProperties = []
  window.vocabsFiltered = {}
  window.vocabsByGroups = {}

  // window.vocabsDataTypes = [{"value":"@aa-Afar","id":"@aa"},{"value":"@ab-Abkhazian","id":"@ab"},{"value":"@ae-Avestan","id":"@ae"},{"value":"@af-Afrikaans","id":"@af"},{"value":"@ak-Akan","id":"@ak"},{"value":"@am-Amharic","id":"@am"},{"value":"@an-Aragonese","id":"@an"},{"value":"@ar-Arabic","id":"@ar"},{"value":"@as-Assamese","id":"@as"},{"value":"@av-Avaric","id":"@av"},{"value":"@ay-Aymara","id":"@ay"},{"value":"@az-Azerbaijani","id":"@az"},{"value":"@ba-Bashkir","id":"@ba"},{"value":"@be-Belarusian","id":"@be"},{"value":"@bg-Bulgarian","id":"@bg"},{"value":"@bh-Bihari","id":"@bh"},{"value":"@bi-Bislama","id":"@bi"},{"value":"@bm-Bambara","id":"@bm"},{"value":"@bn-Bengali","id":"@bn"},{"value":"@bo-Tibetan","id":"@bo"},{"value":"@br-Breton","id":"@br"},{"value":"@bs-Bosnian","id":"@bs"},{"value":"@ca-Catalan","id":"@ca"},{"value":"@ca-Valencian","id":"@ca"},{"value":"@ce-Chechen","id":"@ce"},{"value":"@ch-Chamorro","id":"@ch"},{"value":"@co-Corsican","id":"@co"},{"value":"@cr-Cree","id":"@cr"},{"value":"@cs-Czech","id":"@cs"},{"value":"@cu-Church Slavic","id":"@cu"},{"value":"@cu-Church Slavonic","id":"@cu"},{"value":"@cu-Old Bulgarian","id":"@cu"},{"value":"@cu-Old Church Slavonic","id":"@cu"},{"value":"@cu-Old Slavonic","id":"@cu"},{"value":"@cv-Chuvash","id":"@cv"},{"value":"@cy-Welsh","id":"@cy"},{"value":"@da-Danish","id":"@da"},{"value":"@de-German","id":"@de"},{"value":"@dv-Dhivehi","id":"@dv"},{"value":"@dv-Divehi","id":"@dv"},{"value":"@dv-Maldivian","id":"@dv"},{"value":"@dz-Dzongkha","id":"@dz"},{"value":"@ee-Ewe","id":"@ee"},{"value":"@el-Greek, Modern (1453-)","id":"@el"},{"value":"@en-English","id":"@en"},{"value":"@eo-Esperanto","id":"@eo"},{"value":"@es-Castilian","id":"@es"},{"value":"@es-Spanish","id":"@es"},{"value":"@et-Estonian","id":"@et"},{"value":"@eu-Basque","id":"@eu"},{"value":"@fa-Persian","id":"@fa"},{"value":"@ff-Fulah","id":"@ff"},{"value":"@fi-Finnish","id":"@fi"},{"value":"@fj-Fijian","id":"@fj"},{"value":"@fo-Faroese","id":"@fo"},{"value":"@fr-French","id":"@fr"},{"value":"@fy-Western Frisian","id":"@fy"},{"value":"@ga-Irish","id":"@ga"},{"value":"@gd-Gaelic","id":"@gd"},{"value":"@gd-Scottish Gaelic","id":"@gd"},{"value":"@gl-Galician","id":"@gl"},{"value":"@gn-Guarani","id":"@gn"},{"value":"@gu-Gujarati","id":"@gu"},{"value":"@gv-Manx","id":"@gv"},{"value":"@ha-Hausa","id":"@ha"},{"value":"@he-Hebrew","id":"@he"},{"value":"@hi-Hindi","id":"@hi"},{"value":"@ho-Hiri Motu","id":"@ho"},{"value":"@hr-Croatian","id":"@hr"},{"value":"@ht-Haitian","id":"@ht"},{"value":"@ht-Haitian Creole","id":"@ht"},{"value":"@hu-Hungarian","id":"@hu"},{"value":"@hy-Armenian","id":"@hy"},{"value":"@hz-Herero","id":"@hz"},{"value":"@ia-Interlingua","id":"@ia"},{"value":"@id-Indonesian","id":"@id"},{"value":"@ie-Interlingue","id":"@ie"},{"value":"@ie-Occidental","id":"@ie"},{"value":"@ig-Igbo","id":"@ig"},{"value":"@ii-Nuosu","id":"@ii"},{"value":"@ii-Sichuan Yi","id":"@ii"},{"value":"@ik-Inupiaq","id":"@ik"},{"value":"@io-Ido","id":"@io"},{"value":"@is-Icelandic","id":"@is"},{"value":"@it-Italian","id":"@it"},{"value":"@iu-Inuktitut","id":"@iu"},{"value":"@ja-Japanese","id":"@ja"},{"value":"@jv-Javanese","id":"@jv"},{"value":"@ka-Georgian","id":"@ka"},{"value":"@kg-Kongo","id":"@kg"},{"value":"@ki-Gikuyu","id":"@ki"},{"value":"@ki-Kikuyu","id":"@ki"},{"value":"@kj-Kuanyama","id":"@kj"},{"value":"@kj-Kwanyama","id":"@kj"},{"value":"@kk-Kazakh","id":"@kk"},{"value":"@kl-Greenlandic","id":"@kl"},{"value":"@kl-Kalaallisut","id":"@kl"},{"value":"@km-Central Khmer","id":"@km"},{"value":"@kn-Kannada","id":"@kn"},{"value":"@ko-Korean","id":"@ko"},{"value":"@kr-Kanuri","id":"@kr"},{"value":"@ks-Kashmiri","id":"@ks"},{"value":"@ku-Kurdish","id":"@ku"},{"value":"@kv-Komi","id":"@kv"},{"value":"@kw-Cornish","id":"@kw"},{"value":"@ky-Kirghiz","id":"@ky"},{"value":"@ky-Kyrgyz","id":"@ky"},{"value":"@la-Latin","id":"@la"},{"value":"@lb-Letzeburgesch","id":"@lb"},{"value":"@lb-Luxembourgish","id":"@lb"},{"value":"@lg-Ganda","id":"@lg"},{"value":"@li-Limburgan","id":"@li"},{"value":"@li-Limburger","id":"@li"},{"value":"@li-Limburgish","id":"@li"},{"value":"@ln-Lingala","id":"@ln"},{"value":"@lo-Lao","id":"@lo"},{"value":"@lt-Lithuanian","id":"@lt"},{"value":"@lu-Luba-Katanga","id":"@lu"},{"value":"@lv-Latvian","id":"@lv"},{"value":"@mg-Malagasy","id":"@mg"},{"value":"@mh-Marshallese","id":"@mh"},{"value":"@mi-Maori","id":"@mi"},{"value":"@mk-Macedonian","id":"@mk"},{"value":"@ml-Malayalam","id":"@ml"},{"value":"@mn-Mongolian","id":"@mn"},{"value":"@mr-Marathi","id":"@mr"},{"value":"@ms-Malay","id":"@ms"},{"value":"@mt-Maltese","id":"@mt"},{"value":"@my-Burmese","id":"@my"},{"value":"@na-Nauru","id":"@na"},{"value":"@nb-Bokmål, Norwegian","id":"@nb"},{"value":"@nb-Norwegian Bokmål","id":"@nb"},{"value":"@nd-Ndebele, North","id":"@nd"},{"value":"@nd-North Ndebele","id":"@nd"},{"value":"@ne-Nepali","id":"@ne"},{"value":"@ng-Ndonga","id":"@ng"},{"value":"@nl-Dutch","id":"@nl"},{"value":"@nl-Flemish","id":"@nl"},{"value":"@nn-Norwegian Nynorsk","id":"@nn"},{"value":"@nn-Nynorsk, Norwegian","id":"@nn"},{"value":"@no-Norwegian","id":"@no"},{"value":"@nr-Ndebele, South","id":"@nr"},{"value":"@nr-South Ndebele","id":"@nr"},{"value":"@nv-Navaho","id":"@nv"},{"value":"@nv-Navajo","id":"@nv"},{"value":"@ny-Chewa","id":"@ny"},{"value":"@ny-Chichewa","id":"@ny"},{"value":"@ny-Nyanja","id":"@ny"},{"value":"@oc-Occitan (post 1500)","id":"@oc"},{"value":"@oj-Ojibwa","id":"@oj"},{"value":"@om-Oromo","id":"@om"},{"value":"@or-Oriya","id":"@or"},{"value":"@os-Ossetian","id":"@os"},{"value":"@os-Ossetic","id":"@os"},{"value":"@pa-Panjabi","id":"@pa"},{"value":"@pa-Punjabi","id":"@pa"},{"value":"@pi-Pali","id":"@pi"},{"value":"@pl-Polish","id":"@pl"},{"value":"@ps-Pashto","id":"@ps"},{"value":"@ps-Pushto","id":"@ps"},{"value":"@pt-Portuguese","id":"@pt"},{"value":"@qu-Quechua","id":"@qu"},{"value":"@rm-Romansh","id":"@rm"},{"value":"@rn-Rundi","id":"@rn"},{"value":"@ro-Moldavian","id":"@ro"},{"value":"@ro-Moldovan","id":"@ro"},{"value":"@ro-Romanian","id":"@ro"},{"value":"@ru-Russian","id":"@ru"},{"value":"@rw-Kinyarwanda","id":"@rw"},{"value":"@sa-Sanskrit","id":"@sa"},{"value":"@sc-Sardinian","id":"@sc"},{"value":"@sd-Sindhi","id":"@sd"},{"value":"@se-Northern Sami","id":"@se"},{"value":"@sg-Sango","id":"@sg"},{"value":"@si-Sinhala","id":"@si"},{"value":"@si-Sinhalese","id":"@si"},{"value":"@sk-Slovak","id":"@sk"},{"value":"@sl-Slovenian","id":"@sl"},{"value":"@sm-Samoan","id":"@sm"},{"value":"@sn-Shona","id":"@sn"},{"value":"@so-Somali","id":"@so"},{"value":"@sq-Albanian","id":"@sq"},{"value":"@sr-Serbian","id":"@sr"},{"value":"@ss-Swati","id":"@ss"},{"value":"@st-Sotho, Southern","id":"@st"},{"value":"@su-Sundanese","id":"@su"},{"value":"@sv-Swedish","id":"@sv"},{"value":"@sw-Swahili","id":"@sw"},{"value":"@ta-Tamil","id":"@ta"},{"value":"@te-Telugu","id":"@te"},{"value":"@tg-Tajik","id":"@tg"},{"value":"@th-Thai","id":"@th"},{"value":"@ti-Tigrinya","id":"@ti"},{"value":"@tk-Turkmen","id":"@tk"},{"value":"@tl-Tagalog","id":"@tl"},{"value":"@tn-Tswana","id":"@tn"},{"value":"@to-Tonga (Tonga Islands)","id":"@to"},{"value":"@tr-Turkish","id":"@tr"},{"value":"@ts-Tsonga","id":"@ts"},{"value":"@tt-Tatar","id":"@tt"},{"value":"@tw-Twi","id":"@tw"},{"value":"@ty-Tahitian","id":"@ty"},{"value":"@ug-Uighur","id":"@ug"},{"value":"@ug-Uyghur","id":"@ug"},{"value":"@uk-Ukrainian","id":"@uk"},{"value":"@ur-Urdu","id":"@ur"},{"value":"@uz-Uzbek","id":"@uz"},{"value":"@ve-Venda","id":"@ve"},{"value":"@vi-Vietnamese","id":"@vi"},{"value":"@vo-Volapük","id":"@vo"},{"value":"@wa-Walloon","id":"@wa"},{"value":"@wo-Wolof","id":"@wo"},{"value":"@xh-Xhosa","id":"@xh"},{"value":"@yi-Yiddish","id":"@yi"},{"value":"@yo-Yoruba","id":"@yo"},{"value":"@za-Chuang","id":"@za"},{"value":"@za-Zhuang","id":"@za"},{"value":"@zh-Chinese","id":"@zh"},{"value":"@zu-Zulu","id":"@zu"},{"value":"^^xsd:string","id":"^^xsd:string"},{"value":"^^xsd:boolean","id":"^^xsd:boolean"},{"value":"^^xsd:decimal","id":"^^xsd:decimal"},{"value":"^^xsd:integer","id":"^^xsd:integer"},{"value":"^^xsd:double","id":"^^xsd:double"},{"value":"^^xsd:float","id":"^^xsd:float"},{"value":"^^xsd:date","id":"^^xsd:date"},{"value":"^^xsd:time","id":"^^xsd:time"},{"value":"^^xsd:dateTime","id":"^^xsd:dateTime"},{"value":"^^xsd:dateTimeStamp","id":"^^xsd:dateTimeStamp"},{"value":"^^xsd:gYear","id":"^^xsd:gYear"},{"value":"^^xsd:gMonth","id":"^^xsd:gMonth"},{"value":"^^xsd:gDay","id":"^^xsd:gDay"},{"value":"^^xsd:gYearMonth","id":"^^xsd:gYearMonth"},{"value":"^^xsd:gMonthDay","id":"^^xsd:gMonthDay"},{"value":"^^xsd:duration","id":"^^xsd:duration"},{"value":"^^xsd:yearMonthDuration","id":"^^xsd:yearMonthDuration"},{"value":"^^xsd:dayTimeDuration","id":"^^xsd:dayTimeDuration"},{"value":"^^xsd:byte","id":"^^xsd:byte"},{"value":"^^xsd:short","id":"^^xsd:short"},{"value":"^^xsd:int","id":"^^xsd:int"},{"value":"^^xsd:long","id":"^^xsd:long"},{"value":"^^xsd:unsignedByte","id":"^^xsd:unsignedByte"},{"value":"^^xsd:unsignedShort","id":"^^xsd:unsignedShort"},{"value":"^^xsd:unsignedInt","id":"^^xsd:unsignedInt"},{"value":"^^xsd:unsignedLong","id":"^^xsd:unsignedLong"},{"value":"^^xsd:positiveInteger","id":"^^xsd:positiveInteger"},{"value":"^^xsd:nonNegativeInteger","id":"^^xsd:nonNegativeInteger"},{"value":"^^xsd:negativeInteger","id":"^^xsd:negativeInteger"},{"value":"^^xsd:nonPositiveInteger","id":"^^xsd:nonPositiveInteger"},{"value":"^^xsd:hexBinary","id":"^^xsd:hexBinary"},{"value":"^^xsd:base64Binary","id":"^^xsd:base64Binary"},{"value":"^^xsd:anyURI","id":"^^xsd:anyURI"},{"value":"^^xsd:language","id":"^^xsd:language"},{"value":"^^xsd:normalizedString","id":"^^xsd:normalizedString"},{"value":"^^xsd:token","id":"^^xsd:token"},{"value":"^^xsd:NMTOKEN","id":"^^xsd:NMTOKEN"},{"value":"^^xsd:Name","id":"^^xsd:Name"},{"value":"^^xsd:NCName","id":"^^xsd:NCName"}];
  window.vocabsDataTypes = ['N/A','URL','^^xsd:string','^^xsd:boolean','^^xsd:decimal','^^xsd:integer','^^xsd:double','^^xsd:float','^^xsd:date','^^xsd:time','^^xsd:dateTime','^^xsd:dateTimeStamp','^^xsd:gYear','^^xsd:gMonth','^^xsd:gDay','^^xsd:gYearMonth','^^xsd:gMonthDay','^^xsd:duration','^^xsd:yearMonthDuration','^^xsd:dayTimeDuration','^^xsd:byte','^^xsd:short','^^xsd:int','^^xsd:long','^^xsd:unsignedByte','^^xsd:unsignedShort','^^xsd:unsignedInt','^^xsd:unsignedLong','^^xsd:positiveInteger','^^xsd:nonNegativeInteger','^^xsd:negativeInteger','^^xsd:nonPositiveInteger','^^xsd:hexBinary','^^xsd:base64Binary','^^xsd:anyURI','^^xsd:language','^^xsd:normalizedString','^^xsd:token','^^xsd:NMTOKEN','^^xsd:Name','^^xsd:NCName','@aa-Afar','@ab-Abkhazian','@ae-Avestan','@af-Afrikaans','@ak-Akan','@am-Amharic','@an-Aragonese','@ar-Arabic','@as-Assamese','@av-Avaric','@ay-Aymara','@az-Azerbaijani','@ba-Bashkir','@be-Belarusian','@bg-Bulgarian','@bh-Bihari','@bi-Bislama','@bm-Bambara','@bn-Bengali','@bo-Tibetan','@br-Breton','@bs-Bosnian','@ca-Catalan','@ca-Valencian','@ce-Chechen','@ch-Chamorro','@co-Corsican','@cr-Cree','@cs-Czech','@cu-Church Slavic','@cu-Church Slavonic','@cu-Old Bulgarian','@cu-Old Church Slavonic','@cu-Old Slavonic','@cv-Chuvash','@cy-Welsh','@da-Danish','@de-German','@dv-Dhivehi','@dv-Divehi','@dv-Maldivian','@dz-Dzongkha','@ee-Ewe','@el-Greek, Modern (1453-)','@en-English','@eo-Esperanto','@es-Castilian','@es-Spanish','@et-Estonian','@eu-Basque','@fa-Persian','@ff-Fulah','@fi-Finnish','@fj-Fijian','@fo-Faroese','@fr-French','@fy-Western Frisian','@ga-Irish','@gd-Gaelic','@gd-Scottish Gaelic','@gl-Galician','@gn-Guarani','@gu-Gujarati','@gv-Manx','@ha-Hausa','@he-Hebrew','@hi-Hindi','@ho-Hiri Motu','@hr-Croatian','@ht-Haitian','@ht-Haitian Creole','@hu-Hungarian','@hy-Armenian','@hz-Herero','@ia-Interlingua','@id-Indonesian','@ie-Interlingue','@ie-Occidental','@ig-Igbo','@ii-Nuosu','@ii-Sichuan Yi','@ik-Inupiaq','@io-Ido','@is-Icelandic','@it-Italian','@iu-Inuktitut','@ja-Japanese','@jv-Javanese','@ka-Georgian','@kg-Kongo','@ki-Gikuyu','@ki-Kikuyu','@kj-Kuanyama','@kj-Kwanyama','@kk-Kazakh','@kl-Greenlandic','@kl-Kalaallisut','@km-Central Khmer','@kn-Kannada','@ko-Korean','@kr-Kanuri','@ks-Kashmiri','@ku-Kurdish','@kv-Komi','@kw-Cornish','@ky-Kirghiz','@ky-Kyrgyz','@la-Latin','@lb-Letzeburgesch','@lb-Luxembourgish','@lg-Ganda','@li-Limburgan','@li-Limburger','@li-Limburgish','@ln-Lingala','@lo-Lao','@lt-Lithuanian','@lu-Luba-Katanga','@lv-Latvian','@mg-Malagasy','@mh-Marshallese','@mi-Maori','@mk-Macedonian','@ml-Malayalam','@mn-Mongolian','@mr-Marathi','@ms-Malay','@mt-Maltese','@my-Burmese','@na-Nauru','@nb-Bokmål, Norwegian','@nb-Norwegian Bokmål','@nd-Ndebele, North','@nd-North Ndebele','@ne-Nepali','@ng-Ndonga','@nl-Dutch','@nl-Flemish','@nn-Norwegian Nynorsk','@nn-Nynorsk, Norwegian','@no-Norwegian','@nr-Ndebele, South','@nr-South Ndebele','@nv-Navaho','@nv-Navajo','@ny-Chewa','@ny-Chichewa','@ny-Nyanja','@oc-Occitan (post 1500)','@oj-Ojibwa','@om-Oromo','@or-Oriya','@os-Ossetian','@os-Ossetic','@pa-Panjabi','@pa-Punjabi','@pi-Pali','@pl-Polish','@ps-Pashto','@ps-Pushto','@pt-Portuguese','@qu-Quechua','@rm-Romansh','@rn-Rundi','@ro-Moldavian','@ro-Moldovan','@ro-Romanian','@ru-Russian','@rw-Kinyarwanda','@sa-Sanskrit','@sc-Sardinian','@sd-Sindhi','@se-Northern Sami','@sg-Sango','@si-Sinhala','@si-Sinhalese','@sk-Slovak','@sl-Slovenian','@sm-Samoan','@sn-Shona','@so-Somali','@sq-Albanian','@sr-Serbian','@ss-Swati','@st-Sotho, Southern','@su-Sundanese','@sv-Swedish','@sw-Swahili','@ta-Tamil','@te-Telugu','@tg-Tajik','@th-Thai','@ti-Tigrinya','@tk-Turkmen','@tl-Tagalog','@tn-Tswana','@to-Tonga (Tonga Islands)','@tr-Turkish','@ts-Tsonga','@tt-Tatar','@tw-Twi','@ty-Tahitian','@ug-Uighur','@ug-Uyghur','@uk-Ukrainian','@ur-Urdu','@uz-Uzbek','@ve-Venda','@vi-Vietnamese','@vo-Volapük','@wa-Walloon','@wo-Wolof','@xh-Xhosa','@yi-Yiddish','@yo-Yoruba','@za-Chuang','@za-Zhuang','@zh-Chinese','@zu-Zulu'];

  for (var g in window.vocabs){

    if (exclude.indexOf(window.vocabs[g]['name']) === -1){      
      for (var i in window.vocabs[g]['classes']){
        window.vocabsFilteredClasses.push(window.vocabs[g]['classes'][i])
      }
      for (var i in window.vocabs[g]['properties']){
        window.vocabsFilteredProperties.push(window.vocabs[g]['properties'][i])
      }

      if (!window.vocabsByGroups[window.vocabs[g]['group']]){
        window.vocabsByGroups[window.vocabs[g]['group']] = []
      }
      window.vocabsByGroups[window.vocabs[g]['group']].push(window.vocabs[g])

      window.vocabsFiltered[window.vocabs[g]['name']] = window.vocabs[g];
    }
  }
}

var resizeSpreadSheet = function(){
  var data = $(window.sheetIDName).jexcel('getData', false);
  // $(window.sheetIDName).jexcel('destroy');
  // window.sheetIDName = window.sheetIDName + '1'
  // $("<div id=\""+sheetIDName+"\" />").appendTo("div#sheetHolder");
  initSpreadSheet(data)
}

var saveData = function(callback){

    var data = $(window.sheetIDName).jexcel('getData', false);
    var postData = []
    var fixedSomething = false

    for (var d in data){
        var s = data[d][0];
        var p = data[d][1];
        var o = data[d][2];
        var l = data[d][3];

        if (s.search('http://sandbase.semlab.io/wiki/Item:')>-1){
          s = s.replace('http://sandbase.semlab.io/wiki/Item:','http://sandbase.semlab.io/entity/')
          data[d][0] = s
          fixedSomething = true;
        }
        if (o.search('http://sandbase.semlab.io/wiki/Item:')>-1){
          o = o.replace('http://sandbase.semlab.io/wiki/Item:','http://sandbase.semlab.io/entity/')
          data[d][2] = o
          fixedSomething = true;
        }
        if (s.search('https://www.wikidata.org/wiki/')>-1){
          s = s.replace('https://www.wikidata.org/wiki/','https://www.wikidata.org/entity/')
          data[d][0] = s
          fixedSomething = true;
        }
        if (o.search('https://www.wikidata.org/wiki/')>-1){
          o = o.replace('https://www.wikidata.org/wiki/','https://www.wikidata.org/entity/')
          data[d][2] = o
          fixedSomething = true;
        }
        if (p.search('http://sandbase.semlab.io/wiki/Property:')>-1){
          p = p.replace('http://sandbase.semlab.io/wiki/Property:','http://sandbase.semlab.io/entity/')
          data[d][1] = p
          fixedSomething = true;
        }
        if (p.search('https://www.wikidata.org/wiki/Property:')>-1){
          p = p.replace('https://www.wikidata.org/wiki/Property:','https://www.wikidata.org/entity/')
          data[d][1] = p
          fixedSomething = true;
        }


        if (o.startsWith('"') || o.startsWith("'") || o.startsWith("“")   ) {
          o = o.substring(1)
          data[d][2] = o
          fixedSomething = true;
        }
        if (o.endsWith('"') || o.endsWith("'") || o.endsWith("”") )  {
          o = o.slice(0, -1)
          data[d][2] = o
          fixedSomething = true;
        }


        if (s === '' && p === '' && o === '' && l === ''){
          continue
        }

                
        postData.push({s:s,p:p,o:o,l:l})  
        
        
    }

    if (fixedSomething){
      initSpreadSheet(data)
    }  

    var payload = {
      graph: postData,
      text : $("#share-text").val(),
      graphPos: window.nodePositions,
      graphLock: window.nodePositionsLock
    }

    

    $.ajax({
        url:"/subset/" + window.subsetID,
        method:"POST", //First change type to method here

        data:JSON.stringify(payload),
        contentType:"application/json; charset=utf-8",
        success:function(response) {

          if (callback) callback(null,response)         

       },
       error:function(){
        alert("error");
        if (callback) callback('error',null)        
       }

    });


    return postData

}



var saveGraphImage = function(uuid,imageData){

    var payload = {
      uuid: uuid,
      image:imageData
    }
    $.ajax({
        url:"/subsetimage/",
        method:"POST", //First change type to method here

        data:JSON.stringify(payload),
        contentType:"application/json; charset=utf-8",
        success:function(response) {

          // console.log('done saving image')

       },
       error:function(){
        console.log("error saving image data");
       }

    });

}


var checkForBlankRow = function(){
  // is there at least one empty row?
  var data = $(window.sheetIDName).jexcel('getData');
  var hasEmpty = false;
  for (var x in data){
    if (data[x].join('') === ''){
      hasEmpty = true
    }
  }
  if (!hasEmpty){
    $(window.sheetIDName).jexcel('insertRow', 1);
  }
}

var updateTriples = function(){

  // is the tab even open
  if ($("#tab-triples-li").hasClass('is-active')){




    $.get( "/subset/"+window.subsetID+'.nt', function( data ) {
      $( "#triples-nt" ).text( data );      
    });
   $.get( "/subset/"+window.subsetID+'.ttl', function( data ) {
      $( "#triples-ttl" ).text( data );      
    });
   $.get( "/subset/"+window.subsetID+'.jsonld', function( data ) {
      $( "#triples-json" ).text( JSON.stringify(data,null,2) );      
    });


  }


}

var dataChanged = function(){

  checkForBlankRow()

  if (window.firstLoad){
    window.firstLoad = false;
    return false
  }

  var graph = saveData(function(err,response){
    
    updateTriples();
  });

  buildCytoGraphData(graph);
  setCyImage();
  saveCyImage();
  
}

var initSpreadSheet = function(data){
  if (!data && !window.graphData){
    var data = [['','','','']];
  }else if (data){

    // use the passed data pram

  }else if (window.graphData){

    var data = []
    for (var x in window.graphData.graph){      
      data.push([window.graphData.graph[x]['s'],window.graphData.graph[x]['p'],window.graphData.graph[x]['o'],window.graphData.graph[x]['l']])
    }
  }

  $("#sheetHolder").append("<div id=\""+window.sheetIDName+"\"");

  $("#edit-url").val(window.location.href);

  $(window.sheetIDName).jexcel({
      data:data,
      colHeaders: ['Subject', 'Predicate', 'Object', 'Literal Type'],
      colWidths: [ ($(window).width() - 130) / 3, ($(window).width() - 130) / 3, ($(window).width() - 130) / 3,100 ],
      onafterchange: dataChanged,
      allowInsertColumn: false,
      allowManualInsertColumn: false,
      allowDeleteColumn: false,
      columns: [

          { type: 'autocomplete', cache:window.vocabsFilteredClasses },
          { type: 'autocomplete', cache:window.vocabsFilteredProperties },
          { type: 'autocomplete', cache:window.vocabsFilteredClasses },
          { type: 'dropdown', source:window.vocabsDataTypes }
      ]
  });

}

var prefixURI = function(uri){
  for (var key in window.prefixLookup){
    if (uri.search(window.prefixLookup[key]) > -1){
      uri = uri.replace(window.prefixLookup[key],key+':')
    }
  }
  return uri
}


var buildCytoGraphData = function(graph){

  

  var network = {
    nodes : [],
    edges : []
  }

  var nodeLookup = []

  for (var x in graph){

    var s = graph[x]['s']
    var p = graph[x]['p']
    var o = graph[x]['o']
    var l = graph[x]['l']

    if (s === '' && p === '' && o === '' && l === ''){
      continue
    }

    // object property
    var dataProperty = true;
    


    // data property
    if (l !== 'N/A' && l !== ''){
      dataProperty = true;
    }else if (l === '' && o.startsWith('http')){
    // object
      dataProperty = false
    }

    // the subject
    if (nodeLookup.indexOf(s) === -1){
      network.nodes.push({
        classes : 'bottom-center',
        data    : {
          id    : s,
          label : prefixURI(s),
          props : ''
        },
        position: {
          x: (window.nodePositions && window.nodePositions[s] && window.nodePositions[s].x) ? window.nodePositions[s].x : null,
          y: (window.nodePositions && window.nodePositions[s] && window.nodePositions[s].y) ? window.nodePositions[s].y : null
        }
      })
      nodeLookup.push(s)
    }

    // the object    
    if (dataProperty){
      if (nodeLookup.indexOf(s+'|'+o) === -1){

        var dataType = ""
        if (l !== '' && l !== 'URL' && l !== 'N/A'){
          dataType = l.split('-')[0]
        }

        network.nodes.push({
          classes : 'center-center literal',
          data    : {
            id    : s+'|'+o,
            label : '"'+o+'"' +dataType,
            props : ''
          },
          position: {
            x: (window.nodePositions && window.nodePositions[s+'|'+o] && window.nodePositions[s+'|'+o].x) ? window.nodePositions[s+'|'+o].x : null,
            y: (window.nodePositions && window.nodePositions[s+'|'+o] && window.nodePositions[s+'|'+o].y) ? window.nodePositions[s+'|'+o].y : null
          }
        })
        nodeLookup.push(o)
      }
    }else{
      if (nodeLookup.indexOf(o) === -1){
        network.nodes.push({
          classes : 'bottom-center',
          data    : {
            id    : o,
            label : prefixURI(o),
            props : ''
          },
          position: {
            x: (window.nodePositions && window.nodePositions[o] && window.nodePositions[o].x) ? window.nodePositions[o].x : null,
            y: (window.nodePositions && window.nodePositions[o] && window.nodePositions[o].y) ? window.nodePositions[o].y : null
          }
        })
        nodeLookup.push(o)
      }
    }

    // predicate
    if (dataProperty){
      network.edges.push({
        classes : 'autorotate',
        data    : {
          label : prefixURI(p),
          source : s,
          target : s+'|'+o
        }
      })

    }else{
      network.edges.push({
        classes : 'autorotate',
        data    : {
          label : prefixURI(p),
          source : s,
          target : o
        }
      })


    }
  }
  
  if (!window.nodePositionsLock){
    var layout = {
              name: 'cose-bilkent',
              animate: false,
              idealEdgeLength: 250,
              nodeOverlap: 0,
            }

  }else{
      layout = { name: 'preset' }

  }


  var cyGraph = window.cyGraph = cytoscape({
        container: document.getElementById('your-graph'),

        boxSelectionEnabled: false,
        autounselectify: true,
        maxZoom: 2,
        minZoom: 0.5,

       layout: layout

        //   layout: {
        //     name: 'cose',
        //     idealEdgeLength: 350,
        //     nodeOverlap: 20,
        //     refresh: 20,
        //     fit: true,
        //     padding: 30,
        //     randomize: false,
        //     componentSpacing: 100,
        //     nodeRepulsion: 550000,
        //     edgeElasticity: 350,
        //     nestingFactor: 5,
        //     gravity: 0,
        //     numIter: 3000,
        //     initialTemp: 1500,
        //     coolingFactor: 0.95,
        //     minTemp: 1.0
        // }
        ,

        style: style,

        elements:network




      });

  var cyGraphClickTimer;  
  cyGraph.on('position', 'node', function(evt){
    clearTimeout(cyGraphClickTimer);
    cyGraphClickTimer = setTimeout(function() {
      setCyImage()
      saveCyImage()
      saveData()
    }, 5000);
   });
  var cyGraphZoomTimer;  
  cyGraph.on('zoom pan', null, function(evt){
    clearTimeout(cyGraphZoomTimer);
    cyGraphZoomTimer = setTimeout(function() {
      setCyImage()
      saveCyImage()
    }, 1000);
   });
}


var setCyImage = function(){
  var canvas = $("canvas")[2];
  var ctx = canvas.getContext("2d");
  var data = canvas.toDataURL("image/png");
  if (data !== 'data:,'){
    window.graphImage = data  
  }  
  
}


var saveCyImage = function(){
  const nodes = window.cyGraph.nodes();
  if (!window.nodePositions){
    window.nodePositions = {}
  }
  nodes.map(node => { return {pos: node.position(), id: node.id()} }).forEach((node) =>{
    window.nodePositions[node.id] = node.pos
  })  
  if (window.shareId){
    saveGraphImage(window.subsetID,window.graphImage)
  }
  $("#share-img-preview").attr('src',window.graphImage)

}



