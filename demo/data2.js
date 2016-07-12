var data = {
	"thead": {
		"rows": [[{"title":"Oppstilling av Bevilgningsrapportering, 31.12.2015", "colspan": 9 }]],
		"cols": [{
			"id":"id",
			"title": "ID",
			"type": "index"
		},{
			"id":"utgiftskapittel",
			"title":"Utgiftskapittel",
			"class": "tcCenterAlign",
			"type": "string"
		},{
			"id":"kapittelnavn",
			"title":"Kapittelnavn",
			"type":"string"
		},{
			"id":"post",
			"title":"Post",
			"class":"tcCenterAlign",
			"type":"string"
		},{
			"id":"posttekst",
			"title":"Posttekst",
			"type":"string"
		},{
			"id":"tildeling",
			"title":"Samlet tildeling",
			"type":"number"
		},{
			"id":"regnskap",
			"title":"Regnskap 2015",
			"type":"number"
		},{
			"id":"merutgift",
			"title":"Merutgift(-) og mindreutgift",
			"type":"method"
		}]
	},
	"tfoot": {
		"cols": [
			{},
			{"title": "Totaler:"},
			{},
			{},
			{},
			{"method": "sum(tildeling)"},
			{"method": "sum(regnskap)"},
			{"method": "sum(merutgift)"},
		]
	},
	"tbody": [
		{
			"utgiftskapittel": "0525",
			"kapittelnavn": "Fylkesmannsembetene - driftsutgifter",
			"post": "01",
			"posttekst": "Driftsutgifter",
			"tildeling": 78633000,
			"regnskap": 77994835,
			"merutgift": "sum(tildeling,-regnskap)"
		},{
			"utgiftskapittel": "0525",
			"kapittelnavn": "Fylkesmannsembetene - spes. driftsutgifter",
			"post": "21",
			"posttekst": "Spesielle driftsutgifter",
			"tildeling": 3868000,
			"regnskap": 9948846,
			"merutgift": "sum(tildeling,-regnskap)"
		},{
			"utgiftskapittel": "0225",
			"kapittelnavn": "Tiltak i grunnopplæringen - driftsutgifter",
			"post": "01",
			"posttekst": "Driftsutgifter",
			"tildeling": 760098,
			"regnskap": 630098
		},{
			"utgiftskapittel": "0225",
			"kapittelnavn": "Tiltak i grunnopplæringa - særskilde driftsutgifter",
			"post": "21",
			"posttekst": "Spesielle driftsutgifter",
			"tildeling": 1190000,
			"regnskap": 1071134
			// "merutgift": "avg(sum(tildeling,-regnskap,avg(tildeling,regnskap),sum(tildeling,regnskap)),382.9,sum(8,8))"
		}
	]
};