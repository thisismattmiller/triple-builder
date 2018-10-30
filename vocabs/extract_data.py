from rdflib import Graph
import glob
import pprint
import os
import json

def fine_unique_predicates():
	unique_predicates = []

	for file in glob.glob('*'):
		if '.py' not in file:

			if '.ttl' in file:
				g = Graph()
				g.parse(file, format='n3')


			else:
				g = Graph()
				g.parse(file)		

			
			for stmt in g:
			    pprint.pprint(stmt[1])
			    if str(stmt[1]) not in unique_predicates:
			    	unique_predicates.append(str(stmt[1]))



	print(unique_predicates)		

	for x in unique_predicates:
		print(x)    	





vocabs = {
	'dcelements.ttl' : {
		'name':'DC Elements',
		'doc':'http://purl.org/dc/elements/1.1/',
		'group':'Biblographic',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://dublincore.org/2012/06/14/dcelements',
		'prefix': 'dc'
		},
	'dcterms.ttl' : {
		'name':'DC Terms',
		'doc':'http://dublincore.org/documents/dcmi-terms/',
		'group':'Biblographic',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://purl.org/dc/terms/',
		'prefix' : 'dcterms'
		},
	'bibframe.rdf' : {
		'name':'Bibframe',
		'doc':'http://id.loc.gov/ontologies/bibframe/',
		'group':'Biblographic',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://id.loc.gov/ontologies/bibframe/',
		'prefix'  : 'bibframe'
		},
	'bibliotek-o.owl' : {
		'name':'Bibliotek-O',
		'doc':'https://bibliotek-o.org/1.0/ontology.html',
		'group':'Biblographic',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://bibliotek-o.org/1.0/ontology/',
		'prefix'  : 'bibliotek'
		},
	'cidoc-crm.xml' : {
		'name':'CIDOC-CRM',
		'doc':'http://www.cidoc-crm.org/get-last-official-release',
		'group':'CIDOC-CRM',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://www.cidoc-crm.org/cidoc-crm/',
		'prefix'  : 'cidoc'
		},
	'foaf.rdf' : {
		'name':'FOAF',
		'doc':'http://xmlns.com/foaf/spec/',
		'group':'People',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://xmlns.com/foaf/0.1/',
		'prefix'  : 'foaf'
		},
	'owl.ttl' : {
		'name':'OWL',
		'doc':'https://www.w3.org/TR/owl2-syntax/',
		'group':'Core',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://www.w3.org/2002/07/owl#',
		'prefix'  : 'owl'
		},
	'prov.owl' : {
		'name':'PROV',
		'doc':'http://www.w3.org/ns/prov',
		'group':'Digital',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://www.w3.org/ns/prov#',
		'prefix'  : 'prov'
		},
	'rdf-schema.ttl' : {
		'name':'RDF Schema',
		'doc':'https://www.w3.org/TR/rdf-schema/',
		'group':'Core',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://www.w3.org/2000/01/rdf-schema#',
		'prefix'  : 'rdfs'
		},
	'rdf.ttl' : {
		'name':'RDF Concepts',
		'doc':'https://www.w3.org/TR/rdf11-concepts/',
		'group':'Core',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
		'prefix'  : 'rdf'
		},
	'relationship.rdf' : {
		'name':'Relationships',
		'doc':'http://purl.org/vocab/relationship/',
		'group':'People',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://purl.org/vocab/relationship/',
		'prefix'  : 'rel'
		},
	'schema.rdf' : {
		'name':'Schema',
		'doc':'http://schema.org/',
		'group':'Schema.org',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://schema.org/',
		'prefix'  : 'schema'
		},
	'skos.rdf' : {
		'name':'SKOS',
		'doc':'http://www.w3.org/2004/02/skos/core',
		'group':'Core',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://www.w3.org/2004/02/skos/core#',
		'prefix'  : 'skos'
		},
	'linked-art.json' : {
		'name':'Linked Art',
		'doc':'http://linked.art/',
		'group':'Art',
		'classes' : [],
		'properties' : [],
		'namespace' : 'https://linked.art/ns/terms/',
		'prefix'  : 'la'
		},
	'linked-art.json' : {
		'name':'Linked Art',
		'doc':'http://linked.art/',
		'group':'Art',
		'classes' : [],
		'properties' : [],
		'namespace' : 'https://linked.art/ns/terms/',
		'prefix'  : 'la'
		},
	'mads.rdf' : {
		'name':'MADS',
		'doc':'http://www.loc.gov/standards/mads/rdf/',
		'group':'Biblographic',
		'classes' : [],
		'properties' : [],
		'namespace' : 'http://www.loc.gov/mads/rdf/v1#',
		'prefix'  : 'mads'
		}



}


unique_objects = []

addedValues = []


for file in glob.glob('*'):
	file_name = os.path.basename(file)
	if '.py' not in file:

		if '.ttl' in file:
			g = Graph()
			g.parse(file, format='n3')

		elif 'linked-art.json' in file:
			#hack
			la = json.load(open(file))
			for key in la['@context']:




				if isinstance(la['@context'][key],dict):
					if key[0].isupper():
						vocabs[file_name]['classes'].append({
								"id"   : f"{vocabs[file_name]['namespace']}{key}",
								"name" : vocabs[file_name]['name'] + ' - ' + key
							})
					else:
						vocabs[file_name]['properties'].append({
								"id"   : f"{vocabs[file_name]['namespace']}{key}",
								"name" : vocabs[file_name]['name'] + ' - ' + key
							})
				

			continue


		else:
			g = Graph()
			g.parse(file)		

		for stmt in g:
		    p = str(stmt[1])


		    # 		    # if p in ['http://www.w3.org/2000/01/rdf-schema#subClassOf','http://www.w3.org/2000/01/rdf-schema#subPropertyOf','http://www.w3.org/1999/02/22-rdf-syntax-ns#type']:

		    if p == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type':
		    	# print(stmt)
		    	if str(stmt[2]) not in unique_objects:
		    		unique_objects.append(str(stmt[2]))



		    	if str(stmt[2]) in ["http://www.w3.org/2000/01/rdf-schema#Class","http://www.w3.org/2002/07/owl#Class","http://www.w3.org/2002/07/owl#Axiom","http://www.w3.org/2002/07/owl#NamedIndividual","http://www.w3.org/2000/01/rdf-schema#Datatype"]:
		    		s = str(stmt[0])
		    		if '/' in s:
		    			# some blank nodes in thurr
		    			name = s.split('/')[-1]
		    			if '#' in s:
		    				name = s.split('#')[-1]

		    			if s not in addedValues:
		    				addedValues.append(s)

			    			vocabs[file_name]['classes'].append({
			    					"id"   : s,
			    					"name" : vocabs[file_name]['name'] + ' - ' + name
			    				})



		    	if str(stmt[2]) in ["http://www.w3.org/1999/02/22-rdf-syntax-ns#Property","http://www.w3.org/2002/07/owl#AnnotationProperty","http://www.w3.org/2002/07/owl#DatatypeProperty","http://www.w3.org/2002/07/owl#FunctionalProperty","http://www.w3.org/2002/07/owl#InverseFunctionalProperty","http://www.w3.org/2002/07/owl#ObjectProperty", "http://www.w3.org/2002/07/owl#SymmetricProperty","http://www.w3.org/2002/07/owl#TransitiveProperty"]:
		    		s = str(stmt[0])
		    		if '/' in s:
		    			# some blank nodes in thurr
		    			name = s.split('/')[-1]
		    			if '#' in s:
		    				name = s.split('#')[-1]


		    			if s not in addedValues:
		    				addedValues.append(s)
				    				
			    			vocabs[file_name]['properties'].append({
			    					"id"   : s,
			    					"name" : vocabs[file_name]['name'] + ' - ' + name
			    				})


json.dump(vocabs,open('../assets/vocabs.json','w'))



