import boto3, os, json

FROM_EMAIL_ADDRESS = 'no-reply@bencf.dev'
MY_EMAIL_ADDRESS = 'bencf99+awstestses@gmail.com'

ses = boto3.client('ses')

def lambda_handler(event, context):
    # Print event data to logs .. 
    print("Received event: " + json.dumps(event))

    body = json.loads(event['body'])
    # Publish message directly to email, provided by EmailOnly or EmailPar TASK
    # ses.send_email( Source=FROM_EMAIL_ADDRESS,
    #     Destination={ 'ToAddresses': [ body['email'] ] }, 
    #     Message={ 'Subject': {'Data': 'I got your message!'},
    #         'Body': {'Text': {'Data': f"I'll get back to you as soon as possible.\nLook forward to connecting.\n\nYou sent:\n{body['message']}"}}
    #     }
    # )
    ses.send_email( Source=FROM_EMAIL_ADDRESS,
        Destination={ 'ToAddresses': [ MY_EMAIL_ADDRESS ] }, 
        Message={ 'Subject': {'Data': f'MSG from {body['email']}'},
            'Body': {'Text': {'Data': f"Subject: {body['subject']}\n\n{body['message']}"}}
        }
    )
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({"message": "Success!"})
    }
