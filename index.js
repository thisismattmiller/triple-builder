const express = require('express')
const app = express()
const fs = require('fs');

app.use(express.static('assets'))
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies


var rooms = {}

// const room = 'ravenna2018'

prefixes = {
	'http://xmlns.com/foaf/0.1/' : 'foaf',
	'http://www.w3.org/2004/02/skos/core#' : 'skos',
	'http://schema.org/' : 'schema',
	'http://id.loc.gov/ontologies/bibframe/' : 'bibframe',
	'http://purl.org/vocab/relationship/' : 'rel',
	'http://www.w3.org/2000/01/rdf-schema#' : 'rdfs',
	'http://www.w3.org/1999/02/22-rdf-syntax-ns#' : 'rdf',
	'https://www.wikidata.org/entity/': 'wd',
	'http://purl.org/dc/terms/' : 'dcterms',
	'http://ravenna2018.semlab.io/entity/' : 'ravenna'
}



// var rawData = JSON.parse(fs.readFileSync(`data/${room}.json`, 'utf8'));
// console.log(rawData)


const testFolder = './data/';

fs.readdirSync(testFolder).forEach(file => {
	if (file.search('.json')>-1){
		var rawData = JSON.parse(fs.readFileSync(`data/${file}`, 'utf8'));
		rooms[file.replace('.json','')] = rawData
	}
	console.log('loaded:')
	console.log(rooms)
})

setInterval(()=>{
	Object.keys(rooms).forEach((r)=>{
		fs.writeFile(`data/${r}.json`, JSON.stringify(rooms[r],null,2), 'utf8', function (err) {
		    if (err) {
		        return console.log(err);
		    }
		}); 
	})
},60000)


app.get('/', (req, res) =>{

res.sendfile('test.html', { root: __dirname + "/assets" } );


})

app.get('/cytodata', function(req, res) {

	var useData = []
	if (req.query.name && req.query.room && rooms[req.query.room].rawData[req.query.name]){
			
		useData = rooms[req.query.room].rawData[req.query.name]

	}

	if (req.query.name == 'returnall'){
		Object.keys(rooms[req.query.room].rawData).forEach((k)=>{
			rooms[req.query.room].rawData[k].forEach((t)=>{
				useData.push(t)
			})

		})
	}





	// collapse entities
	entities = {}
	useData.forEach((t)=>{

		var isLiteral = true
		var s = ''
		var p = ''
		var o = ''
		if (t.s.search('http://') > -1 || t.s.search('https://') > -1){

			Object.keys(prefixes).forEach((k)=>{
				if (s != t.s && s != '') 
					return

				s = t.s.replace(k,prefixes[k] + ':')
				// console.log(t.s)
			})
			
		}else{
			console.log(t.s,'s bad')
			return
		}

		if (t.p.search('http://') > -1 || t.p.search('https://') > -1){

			Object.keys(prefixes).forEach((k)=>{
				if (p != t.p && p != '')
					return
				p = t.p.replace(k,prefixes[k] + ':')

			})

			console.log('------\n\n\n')
			
		}else{
			console.log(t.p,'p bad')
			return
		}

		if (t.o.search('http://') > -1 || t.o.search('https://') > -1){
			isLiteral = false
			Object.keys(prefixes).forEach((k)=>{
				if (o != t.o && o != '')
					return

				o = t.o.replace(k,prefixes[k] + ':')

			})
			
		}else{
			o = t.o
		}


		if (!entities[s]){
			entities[s] = {triples: [], dupeCheck : {}, label:'', props:[]}
		}


		// add in the triples for this subject - > obj
		if (!isLiteral){
			if (!entities[o]){
				entities[o] = {triples: [], dupeCheck : {},label:'',props:[]}
			}
			var dupe = p + o
			if (!entities[s].dupeCheck[dupe]){
				entities[s].dupeCheck[dupe] =true;
				entities[s].triples.push([p,o])
			}		

		}else{


			entities[s].props.push([p,o])

			if (p == 'rdfs:label'){
				entities[s].label = o
			}


		}



	})

	Object.keys(entities).forEach((e)=>{

		if (entities[e].label === ''){
			entities[e].label = e
		}

	})


	var cytoData = {nodes:[],edges:[]}

	Object.keys(entities).forEach((e)=>{

		cytoData.nodes.push({data:{ id: e, label:entities[e].label}, classes: 'bottom-center' })

		entities[e].triples.forEach((t)=>{

			cytoData.edges.push({ data: { source: e, target: t[1], label: t[0] }, classes: 'autorotate' })


		})

	})

	// obj


	// console.log(useData)
	console.log(JSON.stringify(entities,null,2))
	console.log(JSON.stringify(cytoData,null,2))


    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(cytoData));




});
app.post('/savedata', function(req, res) {

	// console.log(req.body)
	// console.log(req.query)

	if (req.query.name && req.query.room){

		if (!rooms[req.query.room]){
			rooms[req.query.room] = {rawData:{}}
		}

		rooms[req.query.room].rawData[req.query.name] = req.body
	}

	console.log(rooms)

	res.send('ok')

});
app.get('/getdata', function(req, res) {

	// console.log(req.body)
	// console.log(req.query)
	var data = []

	if (!rooms[req.query.room]){
		rooms[req.query.room] = {rawData:{}}
	}

	if (req.query.room && req.query.name && rooms[req.query.room].rawData[req.query.name] ){

		rooms[req.query.room].rawData[req.query.name].forEach((t)=>{
			data.push([t.s,t.p,t.o])

		})
		
	}else{
            data = [
                ['','',''],
                ['','',''],
                ['','',''],
                ['','',''],
                ['','',''],
                ['','',''],
                ['','',''],
                ['','','']
            ];


	}
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data));

});

app.get('/getalltriples', function(req, res) {

	// console.log(req.body)
	// console.log(req.query)

	data = []
	Object.keys(rooms[req.query.room].rawData).forEach((k)=>{
		rooms[req.query.room].rawData[k].forEach((t)=>{
			data.push([t.s,t.p,t.o])
		})		

	})


    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data));

});


// app.post(/mydata)


app.listen(3000, () => console.log('Example app listening on port 3000!'))