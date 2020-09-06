const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const path = require('path')

const sqlite = require('sqlite')
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), { Promise })

const port = process.env.PORT || 3000

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/admin', (req, res, next) => {
    if(req.hostname === 'localhost') {
        next()
    } else {
        res.send('Você não tem permissão para fazer isso :)')
    }
})

app.get('/', async(request, response) => {
    const db = await dbConnection
    const categoriasdb = await db.all('select * from categorias')
    const vagas = await db.all('select * from vagas')
    const categorias = categoriasdb.map( cat => {
        return {
            ...cat,
            vagas: vagas.filter( vaga => vaga.categoria === cat.id )
        }
    })
    response.render('home', {
        categorias
    })
})

app.get('/vaga/:id', async(request, response) => {
    const db = await dbConnection
    const vaga = await db.get('select * from vagas where id = '+request.params.id)
    response.render('vaga', {
        vaga
    })
})

app.get('/admin', (req, res) => {
    res.render('admin/home')
})

app.get('/admin/vagas', async(req, res) => {
    const db = await dbConnection
    const vagas = await db.all('select * from vagas;')
    res.render('admin/vagas', {vagas})
})

app.get('/admin/categorias', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias;')
    res.render('admin/cat', {categorias})
})

app.get('/admin/vagas/delete/:id', async(req, res) => {
    const db = await dbConnection
    await db.run('delete from vagas where id ='+req.params.id)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')

    res.render('admin/novavaga', {
        categorias
    })
})

app.post('/admin/vagas/nova', async(req, res) => {
    const { titulo, descricao, categoria } = req.body
    const db = await dbConnection
    await db.run(`insert into vagas(categoria, titulo, descricao) values('${categoria}', '${titulo}', '${descricao}')`)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/editar/:id', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    const vagas = await db.get('select * from vagas where id ='+req.params.id)
    res.render('admin/editarvaga', {
        categorias, vagas
    })
})

app.post('/admin/vagas/editar/:id', async(req, res) => {
    const { titulo, descricao, categoria } = req.body
    const { id } = req.params
    const db = await dbConnection
    await db.run(`update vagas set categoria = ${categoria}, titulo = '${titulo}', descricao = '${descricao}' where id = ${ id }`)
    res.redirect('/admin/vagas')
})

const init = async() => {
    const db = await dbConnection
    await db.run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);')
    
}
init()

app.listen(port, (err) => {
    if(err) {
        console.log('erro na inicialização')
    } else {
        console.log('tudo ok')
    }
})