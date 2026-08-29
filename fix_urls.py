import os
import re

template_dir = r"C:\Users\LENOVO X1 YOGA\OneDrive\Desktop\PROFE  BIENVENIDO\templates"

replacements = {
    "{% static 'index.html' %}": "{% url 'index' %}",
    "{% static 'contacto.html' %}": "{% url 'contacto' %}",
    "{% static 'pedido.html' %}": "{% url 'pedido' %}",
    "{% static 'activador.html' %}": "{% url 'activador' %}"
}

for filename in os.listdir(template_dir):
    if filename.endswith(".html"):
        filepath = os.path.join(template_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        original_content = content
        for old, new in replacements.items():
            content = content.replace(old, new)
        
        if content != original_content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated {filename}")



