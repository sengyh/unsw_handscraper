from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait as Wait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from fake_useragent import UserAgent
from parse_course_page_html import parse_course_page_html
from pathlib import Path
import os
import time
import random

def get_course_page_html(course):
  driver = setup_driver()
  course_url = "https://www.handbook.unsw.edu.au/undergraduate/courses/2021/" + course + "/"
  print(course_url)
  driver.get(course_url)
  Wait(driver,10).until(EC.visibility_of_element_located((By.ID, 'handbook')))
  course_info_html = driver.find_element_by_css_selector('div.css-9lgwr7-Box-Container-SContainer.el608uh0').get_attribute('outerHTML')
  # need to cache all course page htmls (just in case)
  parse_course_page_html(course, course_info_html)
  driver.quit()
  return

def setup_driver():
  OPTS = Options()
  ua = UserAgent()
  user_agent = ua.random
  OPTS.add_argument(f'user-agent={user_agent}')
  OPTS.add_argument("--window-size=1920,1080")
  OPTS.add_argument("--headless")
  DRIVER_PATH = '../chromedriver'
  driver = Chrome(options=OPTS, executable_path=DRIVER_PATH)
  return driver
