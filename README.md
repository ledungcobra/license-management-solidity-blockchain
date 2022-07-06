# After deploy smart contract on ganache tool follow

# !! Note that if npm command failed you should run `npm install` first to install nessesary libraries

# Follow few steps bellow to smart project

# First start web

## type command cd to folder `web`

![cd to web folder](images/3.png)

## then run command `npm start` to run react web page

![Run web project](images/4.png)

## The web UI booted up

![Run web project](images/5.png)

## then run type `cd ..\desktop` and run command `npm start` to start desktop app

![Run desktop project](images/7.png)

## Desktop UI booted

![Run desktop project](images/8.png)

# Start up venderjs

![Run vendorjs](images/9.png)

## type command `docker-compose up` to start up mongodb for venderjs store secret key of the app (sensitive information should not store on blockchain [Vulnability to store sensitive data on blockchain](https://studygroup.moralis.io/t/how-to-read-private-variables/38777)

## If the command failed you should create folder data on the current folder to `docker-compose` create mongodb container and persist data on that folder

## Then run npm start to boot up venderjs

![Start venderjs](images/11.png)

# Venderjs booted

![Venderjs booted](images/12.png)

Link video setup and run application
[Video Setup app](https://www.youtube.com/watch?v=t1n_YJIi4KM)
