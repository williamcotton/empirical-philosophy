export PATH := node_modules/.bin:$(PATH)

all: .env
		ts-node index.js

.env:
		cp default.env .env
