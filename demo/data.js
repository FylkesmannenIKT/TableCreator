var data = {
	"thead": {
		"rows": [
			[{},{},{
				"title":"Kjønnsbalanse", 
				"colspan": 3 
			},{
				"title": "Månedslønn heltidsekvivalent", 
				"colspan":2
			}]
		],
		"cols": [{
			"id":"beskrivelse",
			"title":"",
			"type": "string"
		},{
			"id":"aar",
			"title":"År",
			"type":"year"
		},{
			"id":"manndel",
			"title":"M%",
			"type":"number"
		},{
			"id":"kvinnedel",
			"title":"K%",
			"type":"number"
		},{
			"id":"mkTotal",
			"title":"Total",
			"type":"number",
			"method": "sum(manndel,kvinnedel)"
		},{
			"id":"mannKrProsent",
			"title":"M(Kr/%)",
			"type":"number"
		},{
			"id":"kvinneKrProsent",
			"title":"K(Kr/%)",
			"type":"number"
		}]
	},
	"tfoot": {
		"cols": [
			{"title": "I snitt"},
			{},
			{"method": "avg(manndel)"},
			{"method": "avg(kvinnedel)"},
			{"method": "avg(mkTotal)"},
			{"method": "avg()"},
			{"method": "avg(kvinneKrProsent)"}
		]
	},
	"tbody": [
		{
			"beskrivelse": "Totalt i virksomheten",
			"aar": 2015,
			"manndel": 38,
			"kvinnedel": 62,
			"mannKrProsent": 100,
			"kvinneKrProsent": 91.3
		},
		{
			"aar": 2014,
			"manndel": 38.6,
			"kvinnedel": 61.4,
			"mannKrProsent": 100,
			"kvinneKrProsent": 91.8
		},
		{
			"beskrivelse": "Toppledelse, kategori 1",
			"aar": 2015,
			"manndel": 62,
			"kvinnedel": 38,
			"mannKrProsent": 100,
			"kvinneKrProsent": 101.6
		}
	]
};