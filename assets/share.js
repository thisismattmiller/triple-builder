$( document ).ready(function() {



  $.getJSON( "/assets/vocabs.json")
    .done(function( json ) {
      window.vocabs = json;
      buildPrefixLookup();
      buildCytoGraphData(window.graphData.graph);


    })
    .fail(function( ) {
      alert('There was an error loading the vocabularies. Try refreshing the page.')
    })

})

var prefixURI = function(uri){
  for (var key in window.prefixLookup){
    if (uri.search(window.prefixLookup[key]) > -1){
      uri = uri.replace(window.prefixLookup[key],key+':')
    }
  }
  return uri
}

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
        layout: layout,
        style: style,
        elements:network




      });

}



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