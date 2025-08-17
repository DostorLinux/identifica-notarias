import csv
import yaml, requests, base64, os, glob
from os.path import exists

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


def user_save(dict_user):
    doc_id = (dict_user['doc_id'])
    last_name = dict_user['last_name']
    first_name = dict_user['first_name']
    email = dict_user['email']
    username = email.split('@',1)[0].lower()
    image = photos + '/' + doc_id + '.jpg'
    if exists(image):
        print("Guardando usuario %s" %doc_id)
        with open(image, "rb") as image_file:
            image_b64 = base64.b64encode(image_file.read())
        image_file.close()
        image_b64string = image_b64.decode(ENCODING)
        json_data = {'doc_id' : doc_id,  'role': 'normal', 'last_name': last_name, 'picture' : image_b64string,
                    'first_name': first_name, 'email': email, 'username': username}
        print(json_data)
    else:
        print("%s no existe" %image)

    headers = {'Authorization' : 'Bearer %s' %token}
    request = requests.post(url_image, json=json_data, headers = headers )
    response = request.content
    print(response)

    for key in response:
        if key == "result":
            if response['result'] == 'created':
             with open('log', "a") as log_file:
                 log_file.write('Usuario agregado, ID: ' + doc_id + '\n')
                 log_file.close()
            elif response['result'] == 'updated':
             pass
        elif key == "error":
            if response['code'] == 'INVALID_EMAIL':
                with open('log', "a") as log_file:
                     log_file.write('Error de CORREO en usuario: ' + doc_id + '\n')
                     log_file.close()
            elif response['code'] == 'INVALID_IMAGE':
                with open('log', "a") as log_file:
                     log_file.write('Error de IMAGEN en usuario: ' + doc_id + '\n')
                     log_file.close()
        else:
            with open('log', "a") as log_file:
                log_file.write(str(response) + '\n')
                log_file.close()
    else:
        pass

def read_images_csv(csv_file):
    with open(csv_file,'r') as file:
        csv_reader = csv.DictReader(file, skipinitialspace=True, delimiter=',')
        dict_user = {}
        for l in csv_reader:
            dict_user['doc_id'] = l['RUT']
            dict_user['last_name'] = l['APELLIDO PATERNO'] + ' ' + l['APELLIDO MATERNO']
            dict_user['first_name'] = l['NOMBRES']
            dict_user['email'] = l['CORREO']
            user_save(dict_user)

def del_user(doc_id):
    headers = {'Authorization' : 'Bearer %s' %token}
    user = {'doc_id' : doc_id }
    request = requests.post('https://api-cas.identifica.ai/api/v1/user/del', json=user, headers=headers )
    print(user)
    print(request.json())


def login(api_login):
    api_login_bytes = api_login.encode(ENCODING)
    api_login_b64 = base64.b64encode(api_login.encode(ENCODING)).decode()
    authorization = { 'Authorization' : 'Basic %s' %api_login_b64}
    data = requests.get(url_login, headers = authorization )
    print(data)
    data = data.json()
    return data['token']

token = login(api_login)
#del_user('images/1739313')
read_images_csv('usuarios_slep_rut.csv')
