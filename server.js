const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const filePath = path.join(__dirname, 'data.json');

function readData(callback) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            callback([]);
        } else {
            callback(JSON.parse(data || '[]'));
        }
    });
}

function writeData(data, callback) {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), callback);
}

const server = http.createServer((req, res) => {
    const url = req.url;
    const method = req.method;

    if (url === '/movies' && method === 'GET') {
        readData((movies) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(movies));
        });
    }

    else if (url.startsWith('/movies/') && method === 'GET') {
        const id = parseInt(url.split('/')[2]);

        readData((movies) => {
            const movie = movies.find(m => m.id === id);

            if (!movie) {
                res.writeHead(404);
                return res.end('Movie not found');
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(movie));
        });
    }

        else if (url === '/movies' && method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const newMovie = JSON.parse(body);

            readData((movies) => {
                newMovie.id = Date.now();
                movies.push(newMovie);

                writeData(movies, () => {
                    res.writeHead(201);
                    res.end('Movie added successfully');
                });
            });
        });
    }

        else if (url.startsWith('/movies/') && method === 'PUT') {
        const id = parseInt(url.split('/')[2]);
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const updatedData = JSON.parse(body);

            readData((movies) => {
                let found = false;

                const updatedMovies = movies.map(movie => {
                    if (movie.id === id) {
                        found = true;
                        return { ...movie, ...updatedData };
                    }
                    return movie;
                });

                if (!found) {
                    res.writeHead(404);
                    return res.end('Movie not found');
                }

                writeData(updatedMovies, () => {
                    res.end('Movie updated successfully');
                });
            });
        });
    }

    else if (url.startsWith('/movies/') && method === 'DELETE') {
        const id = parseInt(url.split('/')[2]);

        readData((movies) => {
            const newMovies = movies.filter(m => m.id !== id);

            if (movies.length === newMovies.length) {
                res.writeHead(404);
                return res.end('Movie not found');
            }

            writeData(newMovies, () => {
                res.end('Movie deleted successfully');
            });
        });
    }

    else {
        res.writeHead(404);
        res.end('Route not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});