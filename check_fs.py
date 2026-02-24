import os
print(f"CWD: {os.getcwd()}")
try:
    print(f"Files in CWD: {os.listdir('.')}")
    with open('from_python.txt', 'w') as f:
        f.write('hello from python')
    print("Successfully wrote from_python.txt")
except Exception as e:
    print(f"Error: {e}")
