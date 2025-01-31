# Used to start the app, imports the "create_app()" function

from App import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)