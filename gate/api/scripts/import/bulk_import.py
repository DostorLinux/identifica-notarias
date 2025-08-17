import yaml, requests, base64, os, glob

with open(r'config.yml') as file:
    configuration = yaml.load(file, Loader=yaml.FullLoader)

ENCODING = 'utf-8'
db_host = configuration['database']['host']
db_name = configuration['database']['name']
db_user = configuration['database']['username']
db_pass = configuration['database']['password']
photos = configuration['images-directory']
api_login =  configuration['api-user'] + ':' + configuration['api-pass']

resource_login = 'login'
resource_image = 'user/save'
url_login = configuration['api-server'] + resource_login
url_image = configuration['api-server'] + resource_image


def user_save(image):
    with open(image, "rb") as image_file:
        image_b64 = base64.b64encode(image_file.read())
    image_file.close()
    doc_id = os.path.splitext(image)[0].replace("images/", "")
    print(doc_id)
    image_b64string = image_b64.decode(ENCODING)
    json_data = {'doc_id' : doc_id, 'picture' : image_b64string, 'role': 'user'}
    headers = {'Authorization' : 'Bearer %s' %token}
    request = requests.post(url_image, json=json_data, headers = headers )
#    print(request.content)
    response = request.json()

    for key in response:
        if key == "result":
            if response['result'] == 'created':
             with open('log', "a") as log_file:
                 log_file.write('Usuario agregado, ID: ' + doc_id + '\n')
                 log_file.close()
            elif response['result'] == 'updated':
             with open('log', "a") as log_file:
                 log_file.write('Usuario actualizado, ID: ' + doc_id + '\n')
                 log_file.close()
        elif key == "error":
            if response['code'] == 'INVALID_IMAGE':
                with open('log', "a") as log_file:
                     log_file.write('Error de imagen en usuario: ' + doc_id + '\n')
                     log_file.close()
            elif response['code'] == 'INVALID_IMAGE':
                 with open('log', "a") as log_file:
                     log_file.write('Error en email de usuario: ' + doc_id + '\n')
                     log_file.close()
        else:
            pass


def read_images(photos):
    for filename in glob.glob(photos+'/*.jpg'):
        user_save(filename)


def login(api_login):
    api_login_bytes = api_login.encode(ENCODING)
    api_login_b64 = base64.b64encode(api_login.encode(ENCODING)).decode()
    authorization = { 'Authorization' : 'Basic %s' %api_login_b64}
    data = requests.get(url_login, headers = authorization )
    data = data.json()
    return data['token']

token = login(api_login)
read_images(photos)
