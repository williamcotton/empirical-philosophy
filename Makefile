all: .env
		node index.js

.env:
		cp default.env .env
