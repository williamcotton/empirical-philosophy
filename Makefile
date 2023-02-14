export PATH := node_modules/.bin:$(PATH)

all: .env
		ts-node --esm src/index.ts

.env:
		cp default.env .env
