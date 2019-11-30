# Batch edit service install and launch
1. Clone project to any folder on your PC with git clone command
2. Create .env file (see .env.sample for fields list)
3. Run npm start

# Usage example

To test service run post query on "/batch" with following json body:
```
{
	"endpoint": {
		"url": "https://guesty-user-service.herokuapp.com/user/${userId}",
		"verb": "PUT"
	},
	"payloads":[
		{
			"pathParameters": {
				"userId": 47
			},
			"requestBody":{
				"name": "Test1",
				"age": 25,
				"email": "testemail@gmail.com"
			}
		},
		{
			"pathParameters": {
				"userId": 214
			},
			"requestBody":{
				"name": "Test2",
				"age": 29,
				"email": "testemail2@gmail.com"
			}
		},
		{
			"pathParameters": {
				"userId": 214
			},
			"requestBody":{
				"name": "Test3",
				"age": 34,
				"email": "testemail3@gmail.com"
			}
		},
		{
			"pathParameters": {
				"userId": 47
			},
			"requestBody":{
				"name": "Test1",
				"age": 25,
				"email": "testemail@gmail.com"
			}
		},
		{
			"pathParameters": {
				"userId": 214
			},
			"requestBody":{
				"name": "Test2",
				"age": 29,
				"email": "testemail2@gmail.com"
			}
		},
		{
			"pathParameters": {
				"userId": 214
			},
			"requestBody":{
				"name": "Test3",
				"age": 34,
				"email": "testemail3@gmail.com"
			}
		},
		]
}
```

This example query will run 6 user edit operations (6 PUT requests with corresponding request bodies). 
All templated path pieces (${something}) will be replaced with values of corresponding keys from "pathParameters"
object.
