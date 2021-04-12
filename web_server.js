'use strict'

require('http').createServer((req, res) => {
    res.end('ok')
}).listen(8080)
//process.kill(, 'SIGUSR1')
