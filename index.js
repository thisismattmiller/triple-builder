#!/usr/bin/env node
const express = require('express')
const app = express()
const fs = require('fs');
const uuidv4 = require('uuid/v4');

const rdf = require('rdf-ext')
const formats = require('rdf-formats-common')()
const Readable = require('readable-stream')
const N3 = require('n3');
const JsonLdSerializer = require('rdf-serializer-jsonld-ext');
const NTriplesSerializer = require('rdf-serializer-ntriples')
const shortid = require('shortid');
const crypto = require('crypto');
const bodyParser = require('body-parser');


// symlink these
const subsetGraphDir = 'subsets/'
const subsetShareDir = 'subsetsshare/'
const subsetShareImageDir = 'subsetsshareimages/'


var mustacheExpress = require('mustache-express');

const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { errorOnMissing: true} );

// app.use(express.static('/static','assets'))
// app.use(express.static('/shareimg/','subsetsshare'))

app.use('/assets', express.static('assets'))
app.use('/shareimg', express.static('subsetsshareimages'))



app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies


// Register '.mustache' extension with The Mustache Express
app.engine('.mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');



var loadSubset = function(uuid, callback){
	// is it in the cache
	try{
	    var value = myCache.get( uuid, true );
	    callback(null,value)
	} catch( err ){
    // ENOTFOUND: Key `not-existing-key` not found

    // does it exist on the file system
		fs.stat(`${subsetGraphDir}${uuid}.json`, function(err, stat) {
		    if(err == null) {
		        // File exists
						fs.readFile(`${subsetGraphDir}${uuid}.json`,function(err,content){
						  if(err) console.error(err);
						  var parseJson = JSON.parse(content);							  
							myCache.set( uuid, parseJson, function( err, success ){
							  if( !err && success ){
							    callback(null,parseJson)								    
							  }else{
							  	console.error(err)
							  }
							});
						})
		    } else if(err.code == 'ENOENT') {
		        // file does not exist
				    var newSubset = {
				    	graph : [],
				    	text : '',
				    	graphHash: null,
				    	lastUpdate: 0,
				    	lastSave: 0,
				    	layoutPref: null,
				    	layoutLock: false,
				    	namespaces: {},
				    	shareId: null,
				    	type: 'subset'
				    }							        
		        fs.writeFile(`${subsetGraphDir}${uuid}.json`, JSON.stringify(newSubset));
		        callback(null,newSubset)
		    } else {
		        console.log('Some other error: ', err.code);
		        callback(err,null)
		    }
		});
	}
}


var loadShare = function(uuid, callback){
	// is it in the cache
	try{
	    var value = myCache.get( uuid, true );
	    callback(null,value)
	} catch( err ){
    // ENOTFOUND: Key `not-existing-key` not found

    // does it exist on the file system
		fs.stat(`${subsetShareDir}${uuid}.json`, function(err, stat) {
		    if(err == null) {
		        // File exists
						fs.readFile(`${subsetShareDir}${uuid}.json`,function(err,content){
						  if(err) console.error(err);
						  var parseJson = JSON.parse(content);							  
							myCache.set( uuid, parseJson, function( err, success ){
							  if( !err && success ){
							    callback(null,parseJson)								    
							  }else{
							  	console.error(err)
							  }
							});
						})
		    } else if(err.code == 'ENOENT') {
		        // file does not exist, this was a bad id				   
		        callback(err,null)
		    } else {
		        console.log('Some other error: ', err.code);
		        callback(err,null)
		    }
		});
	}
}


var saveToFile = function(){

	myCache.keys( function( err, mykeys ){
		if( !err ){
	  		mykeys.forEach((key)=>{
					try{
					    var value = myCache.get( key, true );
							if (value.type === 'subset'){
								if (value.lastUpdate > value.lastSave){
									value.lastSave = Date.now();
		        			fs.writeFile(`${subsetGraphDir}${key}.json`, JSON.stringify(value),()=>{});
									myCache.set( key, value, function( err, success ){
									  if( !err && success){
									   	// saved
									  }else{
									  	console.error('Error resaving subset key',err)			
									  }
									});
								}
							}
							if (value.type === 'share'){
								if (value.lastUpdate > value.lastSave){
									value.lastSave = Date.now();
		        			fs.writeFile(`${subsetShareDir}${key}.json`, JSON.stringify(value),()=>{});
									myCache.set( key, value, function( err, success ){
									  if( !err && success){
									   	// saved
									   	console.log(`${subsetShareDir}${key}.json`)
									  }else{
									  	console.error('Error resaving share key',err)			
									  }
									});
								}
							}
					} catch( err ){
						console.error('Error saving to file',err)	
					}
	  		})
	  	}else{
	  		console.error('Error saving to file',err)
	  	}
	});
}


var rdfConvertFromGraph = function(graph,format,callback){

	var usedPrefixes = []


	var preProcess = (stmt) =>{

		for (var x in prefixMap.map){
			if (stmt.s.search(prefixMap.map[x])>-1 && usedPrefixes.indexOf(x)===-1){
				usedPrefixes.push(x)
			}
			if (stmt.p.search(prefixMap.map[x])>-1 && usedPrefixes.indexOf(x)===-1){
				usedPrefixes.push(x)
			}			
		} 

		if (format==='nt'){
			var s = rdf.namedNode(stmt['s']);
			var p = rdf.namedNode(stmt['p']);
			// the object
			if ((stmt['l'] === 'N/A') || (stmt['l'] === '' && stmt['o'].startsWith('http'))){
				var o = rdf.namedNode(stmt['o']);
			}else if (stmt['l'] === 'URL'){
				var o = rdf.literal(stmt['o'])
			}else if (stmt['l'].startsWith('@')){
				var langCode = stmt['l'].split('-')[0].replace('@','')
				var o = rdf.literal(stmt['o'],langCode)
			}else if (stmt['l'].startsWith('^^')){
				if (usedPrefixes.indexOf('xsd')===-1) usedPrefixes.push('xsd')
				var dataType = stmt['l'].split('^^')[1].replace('xsd:','http://www.w3.org/2001/XMLSchema#')
				var o = rdf.literal(stmt['o'],dataType)
			}else{
				var o = rdf.literal(stmt['o'])				
			}

			return rdf.quad(s,p,o)
		}else if (format==='ttl'){

			var p = N3.DataFactory.namedNode(stmt['p'])
			var s = N3.DataFactory.namedNode(stmt['s'])
			// the object
			
			if ((stmt['l'] === 'N/A') || (stmt['l'] === '' && stmt['o'].startsWith('http'))){
				var o = N3.DataFactory.namedNode(stmt['o']);
			}else if (stmt['l'] === 'URL'){
				var o = N3.DataFactory.literal(stmt['o'])
			}else if (stmt['l'].startsWith('@')){
				var langCode = stmt['l'].split('-')[0].replace('@','')
				var o = N3.DataFactory.literal(stmt['o'],langCode)
			}else if (stmt['l'].startsWith('^^')){
				if (usedPrefixes.indexOf('xsd')===-1) usedPrefixes.push('xsd')
				var dataType = stmt['l'].replace('xsd:','http://www.w3.org/2001/XMLSchema#')
				var o = N3.DataFactory.internal.Literal(`"${stmt['o']}"${dataType}`)
			}else{
				var o = N3.DataFactory.literal(stmt['o'])				
			}			

			return N3.DataFactory.quad(s,p,o)
		}else if (format==='json'){

			var s = rdf.namedNode(stmt['s']);
			var p = rdf.namedNode(stmt['p']);
			// the object
			if ((stmt['l'] === 'N/A') || (stmt['l'] === '' && stmt['o'].startsWith('http'))){
				var o = rdf.namedNode(stmt['o']);
			}else if (stmt['l'] === 'URL'){
				var o = rdf.literal(stmt['o'])
			}else if (stmt['l'].startsWith('@')){
				var langCode = stmt['l'].split('-')[0].replace('@','')
				var o = rdf.literal(stmt['o'],langCode)
			}else if (stmt['l'].startsWith('^^')){
				if (usedPrefixes.indexOf('xsd')===-1) usedPrefixes.push('xsd')
				var dataType = stmt['l'].split('^^')[1].replace('xsd:','http://www.w3.org/2001/XMLSchema#')
				var o = rdf.literal(stmt['o'],dataType)
			}else{
				var o = rdf.literal(stmt['o'])				
			}

			return rdf.quad(s,p,o)

		}
	}

	var quads = []
	for (var x in graph){
		quads.push(preProcess(graph[x]))
	}

	if (format === 'nt'){

    let input = new Readable()
    input._readableState.objectMode = true

    input._read = () => {
      for (var x in quads){
      	input.push(quads[x])	
      }
      input.push(null)
    }

	  let serializer = new NTriplesSerializer()
    let stream = serializer.import(input)
    let string = '';
	    
		stream
		    .on('data', (buf) => string += buf.toString())
		    .on('end', () => callback(null,string));
	}

	if (format === 'ttl'){		

		var reducedPrefixes = {}
		usedPrefixes.forEach((prefix)=>{
			reducedPrefixes[prefix] = prefixMap.map[prefix]
		})
		const writer = N3.Writer({ prefixes: reducedPrefixes });
		quads.forEach((q)=>{writer.addQuad(q)})
		writer.end((error, result) => callback(null,result));
	}
	if (format === 'json'){		
		// create a quad stream to feed the serializers
		const quadStream = new Readable({
		  objectMode: true,
		  read: () => {}
		})
		
		formats.serializers['application/ld+json'] = new JsonLdSerializer( { outputFormat: 'string', compact: true } )

		const serializerJsonLd = formats.serializers.find('application/ld+json');
		const streamJsonLd = serializerJsonLd.import(quadStream);


		var reducedPrefixes = {}
		usedPrefixes.forEach((prefix)=>{
			reducedPrefixes[prefix] = prefixMap.map[prefix]
		})

		// forward the prefix map...
		// prefixMap.export(quadStream)
		rdf.prefixMap(reducedPrefixes).export(quadStream)

		// ...and the quad
		quads.forEach((q)=>{quadStream.push(q)})
		quadStream.push(null)


		let string = '';
		streamJsonLd
		    .on('data', (buf) => string += buf.toString())
		    .on('end', () => callback(null,string));
	}

}


var rdfBuildPrefixMap = function(){

	var vocab = JSON.parse(fs.readFileSync('assets/vocabs.json'));
	var prefixLookup = {}
  for (var x in vocab){
    prefixLookup[vocab[x]['prefix']] = vocab[x]['namespace']
  }
  // TODO allow custom namespaces
  prefixLookup['sandbox'] = 'http://sandbase.semlab.io/entity/'
  // prefixLookup['isni'] = 'http://www.isni.org/isni/'
  prefixLookup['wd'] = 'https://www.wikidata.org/entity/'
  prefixLookup['example'] = 'http://www.example.com/'
  prefixLookup['example'] = 'https://www.example.com/'
  prefixLookup['fake'] = 'http://www.fake.com/'
  prefixLookup['fake'] = 'https://www.fake.com/'
  prefixLookup['dc'] = 'https://www.fake.com/'
  prefixLookup['xsd'] = 'http://www.w3.org/2001/XMLSchema#'




	return rdf.prefixMap(prefixLookup)
}


var saveShare = function(shareId,graph){

	var md5 = crypto.createHash('md5').update(shareId).digest("hex")
	// get the serialization text for the graph
	rdfConvertFromGraph(graph.graph,'json',(err,results)=>{
		var json = results
		rdfConvertFromGraph(graph.graph,'ttl',(err,results)=>{
			var ttl = results
			rdfConvertFromGraph(graph.graph,'nt',(err,results)=>{
				var nt = results

				graph.type = 'share'
				graph.rdf = {}
				graph.rdf.json = json
				graph.rdf.ttl = ttl
				graph.rdf.nt = nt
				graph.lastUpdate = Date.now(); 
				myCache.set( md5, graph, function( err, success ){
				  if( !err && success ){
						// console.log()
				  }else{
						console.log(err)
				  }
				});
			})
		})
	})
}



app.get('/', function (req, res) {
  res.render('home', {
    locals: {
      title: 'Welcome'
    }
  });
});



app.post('/subsetimage', function(req, res) {

	var uuid = req.body.uuid.replace(/[^a-z0-9]/gi,'');
	// make sure the graph is loaded
	loadSubset(uuid, (err,graph)=>{
		if (err){
			res.status(500);
			res.send("500 Error loading graph")
			return false
		}

		if (graph.shareId){
			shareMd5 = crypto.createHash('md5').update(graph.shareId).digest("hex")
			var data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
			var buf = new Buffer(data, 'base64');
			fs.writeFile(`${subsetShareImageDir}${shareMd5}.png`, buf,()=>{});

		}
		res.status(200);
		res.send("true")


	})
});


app.get('/shortid', function (req, res) {
	var id = shortid.generate();
	var md5 = crypto.createHash('md5').update(id).digest("hex")
	while (fs.existsSync(`${subsetShareDir}${md5}.json`)){
		var id = shortid.generate();
		var md5 = crypto.createHash('md5').update(id).digest("hex")
	}
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(id, null, 3));
  

});

app.post('/shortid', function(req, res) {
	var uuid = req.body.uuid.replace(/[^a-z0-9]/gi,'');
	// make sure the graph is loaded
	loadSubset(uuid, (err,graph)=>{
		if (err){
			res.status(500);
			res.send("500 Error loading graph")
			return false
		}


		if (req.body.shareId.length > 0){

			if (/^[a-zA-Z0-9\-_]+$/.test(req.body.shareId)){

				// check if that file exists already
				var md5 = crypto.createHash('md5').update(req.body.shareId).digest("hex")
				if (!fs.existsSync(`${subsetShareDir}${md5}.json`)){

					// make it a temp file so it doesnt get take
					fs.writeFile(`${subsetShareDir}${md5}.json`, null, 'utf8', function (err) {
					    if (err) {
					        return console.log(err);
					    }
					}); 

					graph.shareId = req.body.shareId
					graph.lastUpdate = Date.now(()=>{})

					// set it in the main file
					myCache.set( uuid, graph, function( err, success ){
					  if( !err && success ){
					    res.status(200);
					    res.setHeader('Content-Type', 'application/json');
					    res.send(JSON.stringify(graph.shareId));
					  }else{
							res.status(500);
							res.send("500 Error saving graph to memory");
							return false;
					  }
					});

				}else{
			    res.status(200);
			    res.setHeader('Content-Type', 'application/json');
			    res.send('false');

				}
			}else{
		    res.status(200);
		    res.setHeader('Content-Type', 'application/json');
		    res.send('false');	
			}
		}else{
	    res.status(200);
	    res.setHeader('Content-Type', 'application/json');
	    res.send('false');


		}		







		// graph.graph = req.body.uuid
		// graph.text = req.body.text
		// graph.lastUpdate = Date.now(()=>{})


	})
});




app.get('/subset/:uuid\.:ext?', function (req, res) {
	if (req.params.uuid){
		var uuid = req.params.uuid.replace(/[^a-z0-9]/gi,'');
	}else{
		res.send("Bad Subset id")
		return false
	}
	if (uuid.trim().length === 0){
		res.send("Bad Subset id")
		return false
	}
	loadSubset(uuid,(err,results)=>{
		if (req.params.ext === 'json'){
		    res.setHeader('Content-Type', 'application/json');
		    res.send(JSON.stringify(results, null, 3));
		} else if (req.params.ext === 'jsonld'){
				rdfConvertFromGraph(results.graph,'json',(err,results)=>{
			    res.setHeader('Content-Type', 'application/ld+json');
			    res.send(JSON.stringify(JSON.parse(results), null, 3));	 
				})
		} else if (req.params.ext === 'ttl'){
				rdfConvertFromGraph(results.graph,'ttl',(err,results)=>{
			    res.setHeader('Content-Type', 'text/plain');
			    res.send(results);	 
				}) 
		} else if (req.params.ext === 'nt'){
				rdfConvertFromGraph(results.graph,'nt',(err,results)=>{
			    res.setHeader('Content-Type', 'text/turtle');
			    res.send(results);	 
				})  				 
		}else{
		  res.render('subset_edit', {
		      data: results,
		      dataJson: JSON.stringify(results),
		      uuid: uuid,
		      shareId: JSON.stringify(results.shareId),
		      layoutPref: JSON.stringify(results.layoutPref),
		      lockPos:  JSON.stringify(results.layoutLock)
		  });			
		}		
	})


});


app.get('/share/:shareId\.:ext?', function (req, res) {
	if (req.params.shareId){
		var uuid = 	crypto.createHash('md5').update(req.params.shareId).digest("hex")
	}else{
		res.send("Bad share id")
		return false
	}
	if (uuid.trim().length === 0){
		res.send("Bad share id")
		return false
	}
	loadShare(uuid,(err,results)=>{
		// if (req.params.ext === 'json'){
		//     res.setHeader('Content-Type', 'application/json');
		//     res.send(results.rdf.json);
		if (req.params.ext === 'jsonld'){
	    res.setHeader('Content-Type', 'application/ld+json');
	    res.send(JSON.stringify(JSON.parse(results.rdf.json), null, 3));	 
		} else if (req.params.ext === 'ttl'){


			res.setHeader('Content-Type', 'text/plain');
			res.send(results.rdf.ttl); 
		} else if (req.params.ext === 'nt'){
	    res.setHeader('Content-Type', 'text/turtle');
	    res.send(results.rdf.nt);	 
		}else{
		  res.render('subset_share', {
		      data: results,
		      jsonld: JSON.stringify(JSON.parse(results.rdf.json), null, 3),
		      dataJson: JSON.stringify(results),
		      uuid: uuid,
		      shareId: JSON.stringify(results.shareId),
		      shareIdRaw: results.shareId,
		      layoutPref: JSON.stringify(results.layoutPref),
		      lockPos:  JSON.stringify(results.layoutLock),
		      text:  results.text,

		  });			
		}		
	})


});




app.post('/subset/:uuid', function(req, res) {
	var uuid = req.params.uuid.replace(/[^a-z0-9]/gi,'');
	// make sure the graph is loaded
	loadSubset(uuid, (err,graph)=>{
		if (err){
			res.status(500);
			res.send("500 Error loading graph")
			return false
		}
		graph.graph = req.body.graph
		graph.text = req.body.text
		graph.layoutPref = req.body.graphPos
		graph.layoutLock  = req.body.graphLock


		if (graph.shareId){
			saveShare(graph.shareId, Object.assign({}, graph) )
		}
		
		graph.lastUpdate = Date.now(()=>{})

		myCache.set( uuid, graph, function( err, success ){
		  if( !err && success ){
		    res.status(200);
		    res.setHeader('Content-Type', 'application/json');
		    res.send('true');
		  }else{
			res.status(500);
			res.send("500 Error saving graph to memory");
			return false;
		  }
		});
	})
});


app.get('/newsubset', function (req, res) {
	var newUUID = uuidv4().replace(/\-/g,'');
	res.redirect(`/subset/${newUUID}`)
});




app.get('/fork/:shareId', function (req, res) {
	if (req.params.shareId){
		var uuid = 	crypto.createHash('md5').update(req.params.shareId).digest("hex")
	}else{
		res.send("Bad share id")
		return false
	}
	if (uuid.trim().length === 0){
		res.send("Bad share id")
		return false
	}
	loadShare(uuid,(err,results)=>{
		// we have the dataaaa
		var forkedGraph = results.graph

		var newUUID = uuidv4().replace(/\-/g,'');

		// load the new graph
		loadSubset(newUUID, (err,graph)=>{
			if (err){
				res.status(500);
				res.send("500 Error loading graph")
				return false
			}

			// overwrite the graph
			graph.graph = forkedGraph
			graph.lastUpdate = Date.now()

			//save
			myCache.set( newUUID, graph, function( err, success ){
			  if( !err && success ){

			  	//re direct
			  	res.redirect(`/subset/${newUUID}`)


			  }else{
				res.status(500);
				res.send("500 Error saving graph to memory");
				return false;
			  }
			});			
		})		


	
	})


});




setInterval(saveToFile,5000);

const prefixMap = rdfBuildPrefixMap()


app.listen(3000, () => console.log('Example app listening on port 3000!'))